"use client";

import Link from "next/link";
import {
  Sparkles, RefreshCw, Star,
  TrendingUp, TrendingDown, Minus, MessageSquare, Zap,
  ChevronRight, ThumbsUp, ThumbsDown, CheckCircle2,
} from "lucide-react";
import type { DashboardStats, Business, ReviewWithReply } from "@/types";

interface Props {
  stats: DashboardStats;
  reviews: ReviewWithReply[];
  business: Business;
  lastSynced: string;
}

function getSentiment(rating: number) {
  if (rating >= 4) return { label: "Positive", color: "#22C55E", bg: "rgba(34,197,94,0.1)",  Icon: ThumbsUp   };
  if (rating === 3) return { label: "Neutral",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)", Icon: Minus      };
  return               { label: "Negative", color: "#EF4444", bg: "rgba(239,68,68,0.1)",   Icon: ThumbsDown };
}

export function DashboardClient({ stats, reviews, business, lastSynced }: Props) {
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const unanswered = reviews.filter(r => !r.isAnswered);
  const syncTime   = new Date(lastSynced).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const isUp       = stats.avgRating >= 4.2;

  const statCards = [
    {
      label: "Total Reviews",
      display: String(stats.totalReviews),
      sub: `+${stats.newThisMonth} this month`,
      Icon: Star,
      from: "#FFB020", to: "#F97316",
      trend: "up" as const,
    },
    {
      label: "Avg Rating",
      display: `${stats.avgRating.toFixed(1)}⭐`,
      sub: isUp ? "↑ Trending up" : "→ Stable",
      Icon: TrendingUp,
      from: "#7B5CFF", to: "#9B6FFF",
      trend: (isUp ? "up" : "flat") as "up" | "flat",
    },
    {
      label: "Reply Rate",
      display: `${stats.repliedPercent}%`,
      sub: `${unanswered.length} still waiting`,
      Icon: MessageSquare,
      from: "#22C55E", to: "#16A34A",
      trend: (stats.repliedPercent >= 70 ? "up" : "down") as "up" | "down",
    },
    {
      label: "New This Month",
      display: String(stats.newThisMonth),
      sub: "vs 14 last month",
      Icon: Zap,
      from: "#00CFFF", to: "#0891B2",
      trend: (stats.newThisMonth >= 14 ? "up" : "down") as "up" | "down",
    },
  ];

  return (
    <div className="p-5 space-y-4">

      {/* ── 1. GREETING ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "#5D6590" }}>{greeting} 👋</p>
          <h1 className="text-xl font-black text-white mt-0.5">{business.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: "#3A4570" }}>
            {business.category} · {business.location}
          </p>
        </div>
        <form action="/api/reviews/sync" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ background: "#0D1117", border: "1px solid #1A2035", color: "#6A7490" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#7B5CFF";
              (e.currentTarget as HTMLButtonElement).style.color = "#A0AABF";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A2035";
              (e.currentTarget as HTMLButtonElement).style.color = "#6A7490";
            }}
          >
            <RefreshCw className="h-3 w-3" /> Sync · {syncTime}
          </button>
        </form>
      </div>

      {/* ── 2. STATS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, display, sub, Icon, from, to, trend }) => (
          <div key={label} className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg,${from},${to})`, boxShadow: `0 4px 12px ${from}35` }}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              {trend === "up"   && <TrendingUp   className="h-3.5 w-3.5 text-green-400" />}
              {trend === "down" && <TrendingDown  className="h-3.5 w-3.5 text-red-400"   />}
              {trend === "flat" && <Minus         className="h-3.5 w-3.5 text-amber-400" />}
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none">{display}</p>
              <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#5D6590" }}>{label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: from }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. RECENT REVIEWS ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">Recent Reviews</p>
          <Link href="/dashboard/reviews"
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: "#7B5CFF" }}>
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {reviews.slice(0, 4).map((review) => {
            const s     = getSentiment(review.rating);
            const SIcon = s.Icon;
            const days  = Math.floor((Date.now() - new Date(review.reviewDate).getTime()) / 86400000);
            const time  = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;

            return (
              <div key={review.id} className="rounded-2xl p-4"
                style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
                <div className="flex items-start gap-3">

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-white text-sm"
                    style={{ background: `linear-gradient(135deg,${s.color}30,${s.color}15)`, border: `1px solid ${s.color}30` }}>
                    {review.author[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{review.author}</span>
                      <span className="text-xs text-amber-400">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: s.bg, color: s.color }}>
                        <SIcon className="h-2.5 w-2.5" />{s.label}
                      </span>
                      <span className="ml-auto text-[10px]" style={{ color: "#3A4570" }}>{time}</span>
                    </div>

                    {/* Text */}
                    {review.text && (
                      <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "#6A7490" }}>
                        {review.text}
                      </p>
                    )}

                    {/* Action */}
                    <div className="mt-2">
                      {review.isAnswered ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#22C55E" }}>
                          <CheckCircle2 className="h-3 w-3" /> Replied
                        </span>
                      ) : (
                        <Link href="/dashboard/ai-replies"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition-all"
                          style={{
                            background: review.rating <= 2 ? "rgba(239,68,68,0.15)" : "rgba(123,92,255,0.15)",
                            color:      review.rating <= 2 ? "#EF4444"              : "#7B5CFF",
                            border:     `1px solid ${review.rating <= 2 ? "rgba(239,68,68,0.25)" : "rgba(123,92,255,0.25)"}`,
                          }}>
                          <Sparkles className="h-3 w-3" />
                          {review.rating <= 2 ? "Reply Urgently" : "Reply with AI"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
