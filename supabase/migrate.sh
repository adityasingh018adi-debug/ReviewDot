#!/usr/bin/env bash
#
# Applies supabase/migrations/*.sql in order, once each.
#
# The previous runner was a shell loop that re-ran every file on every
# invocation, so it worked exactly once per database and failed on `create type`
# thereafter. That is fine until the first time you need to alter a live table.
#
# This records what has run in `schema_migrations`, with a checksum, so:
#   * applying twice is a no-op
#   * editing a migration that has already run is an error, not a silent no-op
#   * each file runs inside its own transaction and rolls back on failure
#
# Usage:
#   npm run db:migrate                 apply anything outstanding
#   npm run db:migrate -- --baseline   record every file as applied WITHOUT
#                                      running it, for a database that already
#                                      has the schema (use once, then never)
#   npm run db:migrate -- --status     list what has run and what has not
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is not set}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/migrations"
MODE="apply"
case "${1:-}" in
  --baseline) MODE="baseline" ;;
  --status)   MODE="status" ;;
  "")         ;;
  *) echo "unknown option: $1" >&2; exit 2 ;;
esac

psql_q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -t -A "$@"; }

# The tracking table lives in `public`, where Supabase grants anon and
# authenticated by default — so it is locked down explicitly. Row level security
# with no policy means no client role can read or write it at all; the runner
# reaches it through the service role or a direct superuser connection.
#
# client_min_messages keeps `create table if not exists` from printing a notice
# on every run.
psql_q -c "
set client_min_messages = warning;
create table if not exists schema_migrations (
  version     text primary key,
  checksum    text not null,
  applied_at  timestamptz not null default now()
);
alter table schema_migrations enable row level security;
revoke all on schema_migrations from public;
do \$\$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema_migrations from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema_migrations from authenticated';
  end if;
end \$\$;" >/dev/null

shopt -s nullglob
files=("$DIR"/*.sql)
if [ ${#files[@]} -eq 0 ]; then echo "no migrations found in $DIR" >&2; exit 1; fi

status=0
for file in "${files[@]}"; do
  version="$(basename "$file" .sql)"
  checksum="$(md5sum "$file" | cut -d' ' -f1)"
  recorded="$(psql_q -c "select checksum from schema_migrations where version = '$version'")"

  if [ -n "$recorded" ]; then
    if [ "$recorded" != "$checksum" ]; then
      echo "CHANGED  $version — already applied, but the file has been edited since." >&2
      echo "         Recorded $recorded, file is $checksum." >&2
      echo "         Write a new migration rather than editing one that has run." >&2
      status=1
    elif [ "$MODE" = "status" ]; then
      echo "applied  $version"
    fi
    continue
  fi

  case "$MODE" in
    status)
      echo "PENDING  $version"
      ;;
    baseline)
      psql_q -c "insert into schema_migrations (version, checksum) values ('$version', '$checksum')" >/dev/null
      echo "recorded $version (not executed)"
      ;;
    apply)
      printf 'applying %s ... ' "$version"
      # -1 wraps the file in a single transaction: a failure leaves nothing behind
      if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -1 -f "$file"; then
        psql_q -c "insert into schema_migrations (version, checksum) values ('$version', '$checksum')" >/dev/null
        echo "ok"
      else
        echo "FAILED"
        exit 1
      fi
      ;;
  esac
done

exit $status
