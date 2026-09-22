"use client";

import { useState, useRef, useCallback } from "react";
import QRCodeSVG from "react-qr-code";
import {
  QrCode, Download, Link2, Check, ExternalLink, Smartphone,
  Star, Sparkles, TrendingUp, Share2, Printer,
  CheckCircle2, ChevronDown, Zap, MessageSquare,
  BarChart2, Clock, MapPin,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const BUSINESS_NAME = "Sharma's Kitchen";
const BUSINESS_SLUG = "sharmas-kitchen";

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://reviewpilot-eosin.vercel.app";
}

function getQRValue(platform: string) {
  return `${getBaseUrl()}/review/${BUSINESS_SLUG}?platform=${platform}`;
}

// Download the SVG QR as a PNG via canvas (uses div wrapper to find the SVG)
function downloadQR(containerEl: HTMLDivElement | null, platformName: string) {
  if (!containerEl) return;
  const svgEl = containerEl.querySelector("svg");
  if (!svgEl) return;
  const size = 600;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new window.Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.download = `${platformName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}

// ─── Platforms ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "google",
    name: "Google Reviews",
    qrColor: "#4285F4",
    accent: "#4285F4",
    glowColor: "rgba(66,133,244,0.25)",
    bg: "rgba(66,133,244,0.08)",
    border: "rgba(66,133,244,0.22)",
    scans: 87,
    conversions: 34,
    trend: "+12%",
    trendUp: true,
    badge: "Most Popular",
    logo: (size = 28) => (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "zomato",
    name: "Zomato",
    qrColor: "#e23744",
    accent: "#e23744",
    glowColor: "rgba(226,55,68,0.25)",
    bg: "rgba(226,55,68,0.08)",
    border: "rgba(226,55,68,0.22)",
    scans: 64,
    conversions: 29,
    trend: "+24%",
    trendUp: true,
    badge: "🇮🇳 India",
    logo: (size = 28) => (
      <div style={{
        width: size, height: size, background: "#e23744",
        borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: size * 0.58, lineHeight: 1, fontFamily: "sans-serif" }}>Z</span>
      </div>
    ),
  },
  {
    id: "justdial",
    name: "Justdial",
    qrColor: "#FF6600",
    accent: "#FF6600",
    glowColor: "rgba(255,102,0,0.25)",
    bg: "rgba(255,102,0,0.08)",
    border: "rgba(255,102,0,0.22)",
    scans: 41,
    conversions: 16,
    trend: "+8%",
    trendUp: true,
    badge: "🇮🇳 India",
    logo: (size = 28) => (
      <div style={{
        width: size, height: size,
        background: "linear-gradient(135deg,#FF6600,#ff8c33)",
        borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: size * 0.38, lineHeight: 1, fontFamily: "sans-serif" }}>JD</span>
      </div>
    ),
  },
  {
    id: "tripadvisor",
    name: "TripAdvisor",
    qrColor: "#00aa6c",
    accent: "#00aa6c",
    glowColor: "rgba(0,170,108,0.25)",
    bg: "rgba(0,170,108,0.08)",
    border: "rgba(0,170,108,0.22)",
    scans: 29,
    conversions: 11,
    trend: "+5%",
    trendUp: true,
    badge: null,
    logo: (size = 28) => (
      <div style={{
        width: size, height: size, background: "#00aa6c",
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: size * 0.37, lineHeight: 1, fontFamily: "sans-serif" }}>TA</span>
      </div>
    ),
  },
];

// ─── Recent scan data ──────────────────────────────────────────────────────────

const RECENT_SCANS = [
  { time: "2 min ago",  platform: "Google",      location: "Counter QR",  converted: true,  rating: 5 },
  { time: "15 min ago", platform: "Zomato",      location: "Table QR",    converted: true,  rating: 4 },
  { time: "1 hr ago",   platform: "Google",      location: "Receipt QR",  converted: false, rating: null },
  { time: "2 hrs ago",  platform: "Justdial",    location: "Counter QR",  converted: true,  rating: 5 },
  { time: "3 hrs ago",  platform: "TripAdvisor", location: "Table QR",    converted: false, rating: null },
  { time: "5 hrs ago",  platform: "Google",      location: "Counter QR",  converted: true,  rating: 4 },
];

// ─── CopyLink ─────────────────────────────────────────────────────────────────

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
      style={{
        color: copied ? "#22C55E" : "#8892B0",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {copied
        ? <><Check className="h-3.5 w-3.5" />Copied!</>
        : <><Link2 className="h-3.5 w-3.5" />Copy Link</>}
    </button>
  );
}

// ─── QR Card ──────────────────────────────────────────────────────────────────

function QRCard({ p }: { p: typeof PLATFORMS[0] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const link = `${getBaseUrl()}/review/${BUSINESS_SLUG}?platform=${p.id}`;
  const qrValue = getQRValue(p.id);
  const convRate = p.scans > 0 ? Math.round((p.conversions / p.scans) * 100) : 0;

  const handleDownload = useCallback(() => {
    downloadQR(containerRef.current, p.name);
  }, [p.name]);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        background: "#0D1117",
        border: `1px solid ${p.border}`,
        boxShadow: `0 0 0 0 ${p.glowColor}`,
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px 2px ${p.glowColor}`}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: p.bg, borderBottom: `1px solid ${p.border}` }}
      >
        <div className="flex items-center gap-2.5">
          {p.logo(26)}
          <span className="font-semibold text-white text-sm">{p.name}</span>
        </div>
        {p.badge && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: p.accent, color: "#fff" }}
          >
            {p.badge}
          </span>
        )}
      </div>

      {/* QR Code — generated locally, no external API */}
      <div className="flex justify-center py-5 px-4">
        <div
          ref={containerRef}
          className="relative rounded-2xl p-4"
          style={{ background: "#fff", border: `2px solid ${p.border}` }}
        >
          <QRCodeSVG
            value={qrValue}
            size={172}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            style={{ display: "block", borderRadius: 8 }}
          />
          {/* Center logo overlay — safe with level="H" (30% error correction) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-lg p-1"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
            >
              {p.logo(24)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="px-4 py-3 grid grid-cols-3 gap-2 text-center"
        style={{ borderTop: "1px solid #1A2035", borderBottom: "1px solid #1A2035" }}
      >
        <div>
          <p className="text-base font-bold text-white">{p.scans}</p>
          <p className="text-xs" style={{ color: "#5D6590" }}>Scans</p>
        </div>
        <div>
          <p className="text-base font-bold text-white">{p.conversions}</p>
          <p className="text-xs" style={{ color: "#5D6590" }}>Reviews</p>
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: "#22C55E" }}>{convRate}%</p>
          <p className="text-xs" style={{ color: "#5D6590" }}>Conv.</p>
        </div>
      </div>

      {/* Conversion bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: "#1A2035" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${convRate}%`,
              background: `linear-gradient(90deg, ${p.accent}, ${p.accent}88)`,
              transition: "width 0.8s ease",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 mb-2">
          <span className="text-xs" style={{ color: "#5D6590" }}>Conversion rate</span>
          <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>{p.trend} this week ↑</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2 mt-auto">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent}bb)` }}
        >
          <Download className="h-3.5 w-3.5" />
          Download High-Res QR
        </button>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={link} />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ color: "#8892B0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Printer className="h-3.5 w-3.5" />Print
          </button>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: `Review ${BUSINESS_NAME}`, url: link });
              }
            }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            style={{ color: "#8892B0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Share2 className="h-3.5 w-3.5" />Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function QRReviewsPage() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const totalScans = PLATFORMS.reduce((s, p) => s + p.scans, 0);
  const totalConversions = PLATFORMS.reduce((s, p) => s + p.conversions, 0);
  const convRate = totalScans > 0 ? Math.round((totalConversions / totalScans) * 100) : 0;

  const STATS = [
    {
      icon: Smartphone,    label: "Total Scans",        value: String(totalScans),
      sub: "this month",   trend: "+18%",  col: "#7B5CFF", bg: "rgba(123,92,255,0.12)",
    },
    {
      icon: MessageSquare, label: "Reviews Generated",  value: String(totalConversions),
      sub: "via QR codes", trend: "+23%",  col: "#22C55E", bg: "rgba(34,197,94,0.12)",
    },
    {
      icon: TrendingUp,    label: "Conversion Rate",    value: `${convRate}%`,
      sub: "scan → review",trend: "+5%",   col: "#00CFFF", bg: "rgba(0,207,255,0.12)",
    },
    {
      icon: Star,          label: "Avg QR Rating",      value: "4.7",
      sub: "from QR scans",trend: "↑0.2",  col: "#F59E0B", bg: "rgba(245,158,11,0.12)",
    },
  ];

  return (
    <div className="p-5 space-y-6 animate-fade-in" style={{ minHeight: "100vh" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(123,92,255,0.15)", border: "1px solid rgba(123,92,255,0.3)" }}
            >
              <QrCode className="h-4 w-4" style={{ color: "#7B5CFF" }} />
            </div>
            QR Review Generator
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#5D6590" }}>
            Customers scan → AI writes their review → they just post it. More reviews, zero effort.
          </p>
        </div>
        {/* Collapsible "How It Works" trigger */}
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all shrink-0"
          style={{
            color: "#7B5CFF",
            background: "rgba(123,92,255,0.1)",
            border: "1px solid rgba(123,92,255,0.2)",
          }}
        >
          <Zap className="h-3.5 w-3.5" />
          How it works
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-200"
            style={{ transform: showHowItWorks ? "rotate(180deg)" : "none" }}
          />
        </button>
      </div>

      {/* ── How It Works (collapsible) ───────────────────────────────────────── */}
      {showHowItWorks && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0D1117", border: "1px solid #1A2035" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: <QrCode className="h-5 w-5" style={{ color: "#7B5CFF" }} />,
                title: "Print & Display",
                desc: "Print your QR code and place it at your counter, table, or receipt. Customers scan with any smartphone.",
                bg: "rgba(123,92,255,0.12)",
              },
              {
                step: "02",
                icon: <Sparkles className="h-5 w-5" style={{ color: "#00CFFF" }} />,
                title: "AI Writes the Review",
                desc: "Customer rates (1–5★) + adds a few words. AI instantly crafts a polished, authentic review for them.",
                bg: "rgba(0,207,255,0.12)",
              },
              {
                step: "03",
                icon: <CheckCircle2 className="h-5 w-5" style={{ color: "#22C55E" }} />,
                title: "One-Tap Post",
                desc: "Customer copies the review and taps 'Open Google' — taken straight to your review page to paste & post.",
                bg: "rgba(34,197,94,0.12)",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="flex gap-3 p-5"
                style={{ borderRight: i < 2 ? "1px solid #1A2035" : undefined }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: "#5D6590" }}>STEP {item.step}</div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6A7490" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#0D1117", border: "1px solid #1A2035" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.bg }}
            >
              <s.icon className="h-5 w-5" style={{ color: s.col }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "#5D6590" }}>{s.label}</p>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-xs">
                <span className="font-semibold" style={{ color: "#22C55E" }}>{s.trend}</span>
                {" "}
                <span style={{ color: "#5D6590" }}>{s.sub}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── QR Cards — 2×2 grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLATFORMS.map(p => <QRCard key={p.id} p={p} />)}
      </div>

      {/* ── Recent Scan Activity ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0D1117", border: "1px solid #1A2035" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #1A2035" }}
        >
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: "#7B5CFF" }} />
            Recent Scan Activity
          </h2>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #1A2035" }}>
                {["Time", "Platform", "Campaign / Location", "Converted", "Rating"].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold"
                    style={{ color: "#5D6590" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_SCANS.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors"
                  style={{ borderBottom: i < RECENT_SCANS.length - 1 ? "1px solid #0E1628" : "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#0C1020"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8892B0" }}>
                      <Clock className="h-3 w-3" />{row.time}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-white">{row.platform}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8892B0" }}>
                      <MapPin className="h-3 w-3" />{row.location}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {row.converted
                      ? (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#22C55E" }}>
                          <CheckCircle2 className="h-3.5 w-3.5" />Yes
                        </span>
                      )
                      : <span className="text-xs" style={{ color: "#5D6590" }}>—</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    {row.rating
                      ? (
                        <span className="text-xs font-bold" style={{ color: "#F59E0B" }}>
                          {"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)}
                        </span>
                      )
                      : <span className="text-xs" style={{ color: "#5D6590" }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pro Tips Banner ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg,rgba(123,92,255,0.15),rgba(99,102,241,0.1))",
          border: "1px solid rgba(123,92,255,0.3)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(123,92,255,0.2)" }}
          >
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm mb-2">Pro Tips to Get More Reviews</h3>
            <ul className="space-y-1.5">
              {[
                "Place QR codes at the checkout counter & on tables — scan rate increases by 3×",
                "Add 'Scan to leave us a review' text below the QR — customers need the prompt",
                "Train staff to mention it verbally after a positive experience",
                "Include QR code on printed receipts for after-dining reviews",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#8892B0" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white">+340%</p>
            <p className="text-xs mt-0.5" style={{ color: "#5D6590" }}>avg review increase</p>
            <p className="text-xs mt-0.5" style={{ color: "#5D6590" }}>vs manual ask</p>
          </div>
        </div>
      </div>

      {/* ── Preview Link ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{ background: "#0D1117", border: "1px solid #1A2035" }}
      >
        <div>
          <h3 className="font-semibold text-white text-sm">Preview Customer Experience</h3>
          <p className="text-xs mt-0.5" style={{ color: "#5D6590" }}>
            See exactly what your customers see when they scan the QR code
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <code
            className="text-xs px-3 py-1.5 rounded-lg hidden sm:block"
            style={{ background: "#060818", color: "#8892B0", border: "1px solid #1E2540" }}
          >
            /review/{BUSINESS_SLUG}
          </code>
          <button
            onClick={() => window.open(`/review/${BUSINESS_SLUG}?platform=google`, "_blank")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: "linear-gradient(135deg,#7B5CFF,#6366F1)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview Page
          </button>
        </div>
      </div>

    </div>
  );
}
