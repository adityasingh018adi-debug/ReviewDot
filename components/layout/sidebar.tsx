"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3, Bell, Bot, Building2, ChevronLeft, ChevronRight,
  ChevronDown, Code2, CreditCard, LayoutDashboard, LifeBuoy,
  LogOut, Mail, MapPin, MessageCircle, Moon, Newspaper, Plug,
  QrCode, Settings, Sparkles, Star, Sun, Trophy, UserCircle,
  Users, FileText, ShieldCheck, Wrench, LayoutGrid,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { User, Business } from "@/types";
import { ReploraLogo, ReploraIcon } from "@/components/replora-logo";

interface SidebarProps { user: User; business: Business | null; }

// ── Pinned (always visible as full cards) ────────────────────────────────────
const PINNED = [
  { href: "/dashboard",           label: "Dashboard",   icon: LayoutDashboard, from: "#7B5CFF", to: "#9B6FFF" },
  { href: "/dashboard/reviews",   label: "Reviews",     icon: Star,            from: "#FFB020", to: "#FF8C00" },
  { href: "/dashboard/ai-replies",label: "AI Replies",  icon: Sparkles,        from: "#A855F7", to: "#7C3AED" },
  { href: "/dashboard/qr-reviews",label: "QR Reviews",  icon: QrCode,          from: "#6366F1", to: "#4F46E5" },
  { href: "/dashboard/analytics", label: "Analytics",   icon: BarChart3,       from: "#06B6D4", to: "#0891B2" },
  { href: "/dashboard/tools",     label: "All Tools",   icon: LayoutGrid,      from: "#00CFFF", to: "#0099DD" },
];

// ── More tools (compact 2-col icon grid when expanded) ───────────────────────
const MORE_TOOLS = [
  { href: "/dashboard/auto-reply",   label: "Auto-Reply",   icon: Bot,           from: "#3B82F6", to: "#2563EB" },
  { href: "/dashboard/alerts",       label: "Alerts",       icon: Bell,          from: "#EF4444", to: "#DC2626" },
  { href: "/dashboard/whatsapp",     label: "WhatsApp",     icon: MessageCircle, from: "#22C55E", to: "#16A34A" },
  { href: "/dashboard/goals",        label: "Goals",        icon: Trophy,        from: "#F97316", to: "#EA580C" },
  { href: "/dashboard/widget",       label: "Widget",       icon: Code2,         from: "#14B8A6", to: "#0D9488" },
  { href: "/dashboard/digest",       label: "Digest",       icon: Newspaper,     from: "#0EA5E9", to: "#0284C7" },
  { href: "/dashboard/campaigns",    label: "Campaigns",    icon: Mail,          from: "#EC4899", to: "#DB2777" },
  { href: "/dashboard/customers",    label: "Customers",    icon: Users,         from: "#8B5CF6", to: "#7C3AED" },
  { href: "/dashboard/templates",    label: "Templates",    icon: FileText,      from: "#EAB308", to: "#CA8A04" },
  { href: "/dashboard/locations",    label: "Locations",    icon: MapPin,        from: "#10B981", to: "#059669" },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug,          from: "#F59E0B", to: "#D97706" },
  { href: "/dashboard/team",         label: "Team",         icon: Building2,     from: "#60A5FA", to: "#3B82F6" },
];

// ── Account (bottom bar) ─────────────────────────────────────────────────────
const ACCOUNT = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings,   from: "#64748B", to: "#475569" },
  { href: "/dashboard/billing",  label: "Billing",  icon: CreditCard, from: "#FBBF24", to: "#F59E0B" },
  { href: "/dashboard/support",  label: "Support",  icon: LifeBuoy,   from: "#2DD4BF", to: "#14B8A6" },
  { href: "/dashboard/owner",    label: "Owner",    icon: UserCircle, from: "#C084FC", to: "#A855F7" },
  { href: "/admin",              label: "Admin",    icon: ShieldCheck,from: "#F43F5E", to: "#E11D48" },
];

export function Sidebar({ user, business }: SidebarProps) {
  const [collapsed, setCollapsed]   = useState(false);
  const [moreOpen,  setMoreOpen]    = useState(false);
  const [mounted,   setMounted]     = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // Is any "more" tool active? → auto-open section
  const moreHasActive = MORE_TOOLS.some(t => isActive(t.href));
  useEffect(() => { if (moreHasActive) setMoreOpen(true); }, [moreHasActive]);

  // ── Shared nav card ────────────────────────────────────────────────────────
  function NavCard({ href, label, icon: Icon, from, to }: typeof PINNED[0]) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-150 group",
          collapsed && "justify-center"
        )}
        style={{
          color:      active ? "#FFFFFF" : "#A0AABF",
          background: active ? `linear-gradient(135deg,${from}28,${to}14)` : "#0D1117",
          border:     active ? `1px solid ${from}55` : "1px solid #1A2035",
          boxShadow:  active ? `0 2px 12px ${from}22` : "none",
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background    = "#121A2E";
            e.currentTarget.style.borderColor   = "#253050";
            e.currentTarget.style.color         = "#FFFFFF";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background    = "#0D1117";
            e.currentTarget.style.borderColor   = "#1A2035";
            e.currentTarget.style.color         = "#A0AABF";
          }
        }}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200",
            active ? "scale-105" : "group-hover:scale-110"
          )}
          style={{
            background: `linear-gradient(135deg,${from},${to})`,
            boxShadow:  active ? `0 4px 14px ${from}60` : `0 2px 6px ${from}35`,
          }}
        >
          <Icon className="h-[16px] w-[16px] text-white" />
        </div>
        {!collapsed && (
          <>
            <span className="truncate flex-1">{label}</span>
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color: active ? from : "#2E3A58" }}
            />
          </>
        )}
      </Link>
    );
  }

  // ── Compact icon tile (used in "more" grid) ────────────────────────────────
  function IconTile({ href, label, icon: Icon, from, to }: typeof MORE_TOOLS[0]) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        title={label}
        className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150 group"
        style={{
          background: active ? `${from}18` : "#0D1117",
          border:     active ? `1px solid ${from}50` : "1px solid #1A2035",
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background  = "#121A2E";
            e.currentTarget.style.borderColor = "#253050";
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background  = "#0D1117";
            e.currentTarget.style.borderColor = "#1A2035";
          }
        }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200",
            active ? "scale-105" : "group-hover:scale-110"
          )}
          style={{
            background: `linear-gradient(135deg,${from},${to})`,
            boxShadow:  active ? `0 3px 10px ${from}55` : `0 1px 4px ${from}30`,
          }}
        >
          <Icon className="h-[14px] w-[14px] text-white" />
        </div>
        {!collapsed && (
          <span className="text-[10px] font-semibold leading-tight text-center truncate w-full"
            style={{ color: active ? "#FFFFFF" : "#6A7490" }}>
            {label}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className={cn(
      "flex flex-col h-screen sticky top-0 transition-all duration-300 overflow-y-auto overflow-x-hidden",
      "border-r",
      "bg-[#080C14] border-[#141C2E]",
      collapsed ? "w-[58px]" : "w-[220px]"
    )}>

      {/* ── Logo ── */}
      <div className={cn(
        "flex items-center h-[54px] shrink-0 px-3",
        "border-b border-[#141C2E]",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center min-w-0">
            <ReploraLogo size={34} showWordmark collapsed={false} />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <ReploraIcon size={34} />
          </Link>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0"
            style={{ color: "#5D6590" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E4E8F7")}
            onMouseLeave={e => (e.currentTarget.style.color = "#5D6590")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          style={{ color: "#5D6590" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#E4E8F7")}
          onMouseLeave={e => (e.currentTarget.style.color = "#5D6590")}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto overflow-x-hidden space-y-1">

        {/* ── Pinned essential items ── */}
        {PINNED.map(item => <NavCard key={item.href} {...item} />)}

        {/* ── More Tools toggle ── */}
        <div className="pt-1">
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl font-semibold text-[12px] transition-all duration-150",
              collapsed && "justify-center"
            )}
            style={{
              color:      moreOpen ? "#7B5CFF" : "#5D6590",
              background: moreOpen ? "rgba(123,92,255,0.08)" : "transparent",
              border:     moreOpen ? "1px solid rgba(123,92,255,0.22)" : "1px solid transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#7B5CFF";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(123,92,255,0.06)";
            }}
            onMouseLeave={e => {
              if (!moreOpen) {
                (e.currentTarget as HTMLButtonElement).style.color = "#5D6590";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            {/* Dotted icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: moreOpen ? "rgba(123,92,255,0.15)" : "#0D1117", border: "1px solid #1A2035" }}>
              <span className="text-[14px] leading-none" style={{ color: moreOpen ? "#7B5CFF" : "#5D6590" }}>
                ···
              </span>
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">
                  {moreOpen ? "Less Tools" : `More Tools`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(123,92,255,0.15)", color: "#7B5CFF" }}>
                  {MORE_TOOLS.length}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-300"
                  style={{ transform: moreOpen ? "rotate(180deg)" : "rotate(0deg)", color: "#7B5CFF" }}
                />
              </>
            )}
          </button>

          {/* ── More Tools grid (animated expand) ── */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: moreOpen ? "600px" : "0px", opacity: moreOpen ? 1 : 0 }}
          >
            <div className={cn(
              "pt-2 pb-1",
              collapsed ? "flex flex-col gap-1" : "grid grid-cols-2 gap-1.5"
            )}>
              {MORE_TOOLS.map(item => (
                <IconTile key={item.href} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Account section ── */}
        <div className="pt-2" style={{ borderTop: "1px solid #141C2E" }}>
          {!collapsed && (
            <p className="px-1 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "#3E4E70" }}>
              Account
            </p>
          )}
          <div className={cn(
            collapsed ? "flex flex-col gap-1" : "grid grid-cols-2 gap-1.5"
          )}>
            {ACCOUNT.map(item => (
              <IconTile key={item.href} {...item} />
            ))}
          </div>
        </div>

      </nav>

      {/* ── Bottom: theme + user + sign out ── */}
      <div className="p-2 shrink-0 space-y-1.5" style={{ borderTop: "1px solid #141C2E" }}>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-semibold transition-all", collapsed && "justify-center")}
          style={{ color: "#8892B0", background: "#0D1117", border: "1px solid #1A2035" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background   = "#121A2E";
            (e.currentTarget as HTMLButtonElement).style.borderColor  = "#253050";
            (e.currentTarget as HTMLButtonElement).style.color        = "#FFFFFF";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background   = "#0D1117";
            (e.currentTarget as HTMLButtonElement).style.borderColor  = "#1A2035";
            (e.currentTarget as HTMLButtonElement).style.color        = "#8892B0";
          }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#151E30", border: "1px solid #1A2035" }}>
            {mounted
              ? theme === "dark"
                ? <Sun className="h-3.5 w-3.5 text-amber-400" />
                : <Moon className="h-3.5 w-3.5 text-blue-400" />
              : <div className="h-3.5 w-3.5" />}
          </div>
          {!collapsed && mounted && (
            <>
              <span className="flex-1 text-left">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              <div className={cn(
                "w-9 h-[18px] rounded-full relative transition-colors shrink-0",
                theme === "dark" ? "bg-violet-600" : "bg-slate-600"
              )}>
                <div className={cn(
                  "absolute top-[3px] w-3 h-3 rounded-full bg-white shadow transition-all",
                  theme === "dark" ? "left-[21px]" : "left-[3px]"
                )} />
              </div>
            </>
          )}
        </button>

        {/* User card */}
        <div className={cn(
          "flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all",
          collapsed && "justify-center"
        )}
          style={{ background: "#0D1117", border: "1px solid #1A2035" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background  = "#121A2E";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#253050";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background  = "#0D1117";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#1A2035";
          }}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7B5CFF,#9B6FFF)" }}>
              {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate text-white">{user.name ?? "Demo User"}</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px]" style={{ color: "#5D6590" }}>Online</p>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <form action="/api/auth/signout" method="POST">
          <button type="submit"
            className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-semibold transition-all", collapsed && "justify-center")}
            style={{ color: "#8892B0", background: "#0D1117", border: "1px solid #1A2035" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background   = "#180C12";
              (e.currentTarget as HTMLButtonElement).style.borderColor  = "#FF406030";
              (e.currentTarget as HTMLButtonElement).style.color        = "#FF4060";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background   = "#0D1117";
              (e.currentTarget as HTMLButtonElement).style.borderColor  = "#1A2035";
              (e.currentTarget as HTMLButtonElement).style.color        = "#8892B0";
            }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.18)" }}>
              <LogOut className="h-[14px] w-[14px] text-rose-500" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Sign out</span>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
              </>
            )}
          </button>
        </form>

      </div>
    </aside>
  );
}
