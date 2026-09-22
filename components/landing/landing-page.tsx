"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Star, Globe, Shield, TrendingUp, CheckCircle, CheckCircle2,
  ArrowRight, Sparkles, MessageSquare, BarChart3, ChevronRight,
  Play, Menu, X, AlertTriangle, HeartHandshake,
  Utensils, Hotel, Stethoscope, Dumbbell, Scissors, Smartphone,
  ChevronDown, Zap, Gift, Phone, Bot, QrCode, Send,
  Layers, Bell, Users, FileText, BookOpen, Code2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   NAV DROPDOWN DATA
═══════════════════════════════════════════════════════ */
const NAV_PLATFORM = [
  { icon: Sparkles,    color: "#7B5CFF", label: "AI Reply Engine",       desc: "Replies in 20+ languages instantly" },
  { icon: Bot,         color: "#00CFFF", label: "Auto-Reply Bot",        desc: "Hands-free automated posting" },
  { icon: AlertTriangle,color:"#EF4444", label: "Negative Recovery",     desc: "Turn 1★ into 5★ automatically" },
  { icon: BarChart3,   color: "#22C55E", label: "Analytics",             desc: "Rating trends & sentiment heatmap" },
  { icon: QrCode,      color: "#F59E0B", label: "QR Review Collection",  desc: "In-store scan-to-review kiosks" },
  { icon: Send,        color: "#EC4899", label: "WhatsApp Campaigns",    desc: "Request reviews via WhatsApp" },
  { icon: Bell,        color: "#6366F1", label: "Smart Alerts",          desc: "Instant notification on bad reviews" },
  { icon: Layers,      color: "#10B981", label: "Multi-Location",        desc: "Manage all branches from one place" },
];

const NAV_SOLUTIONS = [
  { icon: Utensils,    color: "#F97316", label: "Restaurants & Cafés",   desc: "Food delivery + dine-in reviews" },
  { icon: Hotel,       color: "#6366F1", label: "Hotels & Resorts",      desc: "OTA + Google + TripAdvisor" },
  { icon: Stethoscope, color: "#10B981", label: "Clinics & Hospitals",   desc: "Patient review management" },
  { icon: Dumbbell,    color: "#EF4444", label: "Gyms & Fitness",        desc: "Member feedback automation" },
  { icon: Scissors,    color: "#EC4899", label: "Salons & Spas",         desc: "Beauty industry reputation" },
  { icon: Smartphone,  color: "#7C3AED", label: "App Developers",        desc: "Play Store review automation" },
];

const NAV_RESOURCES = [
  { icon: BookOpen,  color: "#7B5CFF", label: "Documentation",  desc: "Guides, setup & API reference" },
  { icon: FileText,  color: "#22C55E", label: "Case Studies",   desc: "How businesses grew with us" },
  { icon: Code2,     color: "#00CFFF", label: "API Reference",  desc: "Webhooks, REST endpoints" },
  { icon: Users,     color: "#F59E0B", label: "Community",      desc: "Forum & user discussions" },
];

/* ═══════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════ */
const FAQ_ITEMS = [
  { q: "Does it work with Google Business Profile?", a: "Yes. Connect with one click — no plugins, no code. Takes under 60 seconds." },
  { q: "Which languages does the AI support?", a: "20+ languages including Hindi, Tamil, Telugu, Bengali, Marathi, English, French, German, Arabic, Japanese and more. Auto-detected per review." },
  { q: "What is Negative Review Recovery?", a: "When a 1-2★ review comes in, the AI flags it, triggers a private WhatsApp to the customer offering support, and if resolved — the customer can update their review." },
  { q: "Can I approve replies before they post?", a: "Always. Use Auto-Reply for 4-5★ and manual approval for negative reviews — full control where it matters." },
  { q: "Is there a free trial?", a: "14 days free on every plan. No credit card. Cancel anytime." },
  { q: "Do you support Play Store reviews?", a: "Yes — on Business and Agency plans. Manage Google Business + Play Store reviews from one dashboard." },
];

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full text-left group">
      <div className="rounded-2xl overflow-hidden transition-all duration-300"
        style={{ background: open ? "rgba(123,92,255,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${open ? "rgba(123,92,255,0.3)" : "rgba(255,255,255,0.08)"}` }}>
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          <span className="text-sm font-semibold text-white">{q}</span>
          <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-violet-400" : "text-white/30"}`} />
        </div>
        {open && (
          <div className="px-6 pb-5">
            <p className="text-sm leading-relaxed" style={{ color: "#8892B0" }}>{a}</p>
          </div>
        )}
      </div>
    </button>
  );
}

/* animated counter */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let frame = 0;
      const total = 60;
      const tick = () => {
        frame++;
        setV(Math.round(to * Math.min(frame / total, 1)));
        if (frame < total) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════
   NAVBAR DROPDOWN
═══════════════════════════════════════════════════════ */
function NavDropdown({ label, items, wide = false }: {
  label: string;
  items: { icon: React.ElementType; color: string; label: string; desc: string }[];
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white transition-colors py-2 px-1">
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 rounded-2xl overflow-hidden shadow-2xl z-50 ${wide ? "w-[560px]" : "w-72"}`}
          style={{ background: "rgba(8,12,30,0.98)", border: "1px solid rgba(123,92,255,0.2)", backdropFilter: "blur(20px)" }}>
          {/* top accent */}
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#7B5CFF,transparent)" }} />
          <div className={`p-3 ${wide ? "grid grid-cols-2 gap-1" : "space-y-1"}`}>
            {items.map(({ icon: Icon, color, label: l, desc }) => (
              <button key={l}
                className="flex items-start gap-3 p-3 rounded-xl text-left w-full transition-all duration-150 hover:bg-white/5 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{l}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#5D6590" }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING SECTION (standalone for billing toggle state)
═══════════════════════════════════════════════════════ */
const PLANS = [
  {
    name: "Free",
    tag: "Always free",
    desc: "Get started with no risk",
    monthly: 0,
    highlight: false,
    cta: "Get Started Free",
    ctaHref: "/signup",
    features: [
      "10 AI replies / month",
      "1 Google Business location",
      "Hindi + English",
      "Basic dashboard",
      "Email alerts",
    ],
    missing: ["WhatsApp recovery","Play Store","Multi-location","Auto-reply bot"],
  },
  {
    name: "Pro",
    tag: null,
    desc: "Perfect for single-location SMBs",
    monthly: 599,
    highlight: false,
    cta: "Start 14-day Free Trial",
    ctaHref: "/signup",
    features: [
      "Unlimited AI replies",
      "1 location",
      "Hindi, English + 18 languages",
      "Auto-reply bot",
      "Smart alerts",
      "QR review collection",
      "Analytics dashboard",
      "Priority email support",
    ],
    missing: [],
  },
  {
    name: "Business",
    tag: "Most Popular",
    desc: "For growing multi-location businesses",
    monthly: 1499,
    highlight: true,
    cta: "Start 14-day Free Trial",
    ctaHref: "/signup",
    features: [
      "Everything in Pro",
      "Up to 5 locations",
      "Play Store reviews",
      "Negative review recovery",
      "WhatsApp automation",
      "20+ languages auto-detected",
      "Competitor tracking",
      "Priority chat support",
    ],
    missing: [],
  },
  {
    name: "Agency",
    tag: null,
    desc: "For agencies & franchise chains",
    monthly: 3999,
    highlight: false,
    cta: "Contact Sales",
    ctaHref: "/dashboard/support",
    features: [
      "Everything in Business",
      "Unlimited locations",
      "White-label dashboard",
      "Client-level reporting",
      "API & webhooks access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA support",
    ],
    missing: [],
  },
];

function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-28 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.015)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%,rgba(123,92,255,0.07) 0%,transparent 70%)" }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12 space-y-5">
          <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase"
            style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }}>
            Pricing
          </span>
          <h2 className="text-4xl font-black text-white">Simple, honest pricing</h2>
          <p className="text-base" style={{ color: "#8892B0" }}>Start free forever. Upgrade when you need more.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl"
            style={{ background: "rgba(13,17,32,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-sm font-semibold" style={{ color: annual ? "#5D6590" : "#E4E8F7" }}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
              style={{ background: annual ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.1)" }}>
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: annual ? "calc(100% - 20px)" : "4px" }} />
            </button>
            <span className="text-sm font-semibold" style={{ color: annual ? "#E4E8F7" : "#5D6590" }}>
              Annual
              <span className="ml-2 text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>
                2 months free
              </span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PLANS.map(({ name, tag, desc, monthly, highlight, cta, ctaHref, features, missing }) => {
            const price = monthly === 0 ? 0 : annual ? Math.round(monthly * 10) : monthly;
            const originalMonthly = annual && monthly > 0 ? monthly : null;

            return (
              <div key={name}
                className={`rounded-2xl p-5 flex flex-col transition-all duration-300 ${highlight ? "hover:-translate-y-2" : "hover:-translate-y-1"}`}
                style={highlight
                  ? { background: "linear-gradient(160deg,rgba(123,92,255,0.22) 0%,rgba(99,102,241,0.15) 100%)", border: "1px solid rgba(123,92,255,0.45)", boxShadow: "0 24px 60px rgba(123,92,255,0.22)", position: "relative", overflow: "hidden" }
                  : { background: "rgba(13,17,32,0.8)", border: "1px solid rgba(255,255,255,0.07)" }
                }>
                {/* Top shine on highlight card */}
                {highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#7B5CFF,transparent)" }} />
                )}

                {/* Badge */}
                <div className="h-7 mb-3 flex items-center">
                  {tag && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                      style={{ background: "rgba(123,92,255,0.3)", border: "1px solid rgba(123,92,255,0.5)", color: "#C4B5FD" }}>
                      {tag}
                    </span>
                  )}
                </div>

                {/* Plan name + desc */}
                <p className="text-[11px] font-black tracking-widest uppercase mb-0.5"
                  style={{ color: highlight ? "#A78BFA" : "#5D6590" }}>
                  {name}
                </p>
                <p className="text-xs mb-4" style={{ color: highlight ? "#8892B0" : "#5D6590" }}>{desc}</p>

                {/* Price */}
                <div className="mb-1">
                  {monthly === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">Free</span>
                    </div>
                  ) : (
                    <div>
                      {originalMonthly && (
                        <p className="text-xs line-through mb-0.5" style={{ color: "#3A4570" }}>₹{monthly.toLocaleString("en-IN")}/mo</p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</span>
                        <span className="text-xs" style={{ color: "#5D6590" }}>{annual ? "/yr" : "/mo"}</span>
                      </div>
                      {annual && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#4ADE80" }}>
                          ≈ ₹{Math.round(price / 12).toLocaleString("en-IN")}/mo — save ₹{(monthly * 2).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Spacer */}
                <div className="my-4 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: highlight ? "rgba(255,255,255,0.8)" : "#8892B0" }}>
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: highlight ? "#A78BFA" : "#7B5CFF" }} />
                      {f}
                    </li>
                  ))}
                  {missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#3A4570" }}>
                      <X className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-white/10" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={ctaHref}>
                  <button className="w-full py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105"
                    style={highlight
                      ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", boxShadow: "0 8px 24px rgba(123,92,255,0.4)" }
                      : monthly === 0
                      ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#C4B5FD" }
                      : { background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }
                    }>
                    {cta}
                  </button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* ROI callout */}
        <div className="mt-8 rounded-2xl p-5 text-center" style={{ background: "rgba(123,92,255,0.07)", border: "1px solid rgba(123,92,255,0.2)" }}>
          <p className="text-sm font-semibold" style={{ color: "#C4B5FD" }}>
            💡 Business plan users recover an average of{" "}
            <strong className="text-white">4–6 bad reviews per month</strong>,
            each worth ₹5,000–₹50,000 in protected future revenue.
          </p>
        </div>

        {/* Compare plans note */}
        <p className="text-center mt-5 text-xs" style={{ color: "#3A4570" }}>
          All paid plans include a <strong className="text-white/40">14-day free trial</strong> · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#06080F", color: "#E4E8F7" }}>

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b" : ""
      }`} style={scrolled ? { background: "rgba(6,8,15,0.92)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 16px rgba(123,92,255,0.4)" }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg text-white">ReviewPilot</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <NavDropdown label="Platform"  items={NAV_PLATFORM}  wide />
            <NavDropdown label="Solutions" items={NAV_SOLUTIONS} />
            <NavDropdown label="Resources" items={NAV_RESOURCES} />
            <a href="#pricing" className="text-sm font-semibold text-white/80 hover:text-white transition-colors py-2 px-3">
              Pricing
            </a>
          </div>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/dashboard">
              <button className="text-sm font-bold px-5 py-2.5 rounded-xl border transition-all hover:border-violet-400 hover:text-violet-300"
                style={{ borderColor: "rgba(123,92,255,0.4)", color: "#A78BFA", background: "rgba(123,92,255,0.06)" }}>
                Check AI Score
              </button>
            </Link>
            <Link href="/signup">
              <button className="text-sm font-black px-6 py-2.5 rounded-xl text-white transition-all hover:scale-105 hover:shadow-lg uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 20px rgba(123,92,255,0.35)" }}>
                WATCH DEMO
              </button>
            </Link>
          </div>

          <button className="lg:hidden p-2 text-white/70" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden px-4 py-4 space-y-2 border-t"
            style={{ background: "rgba(6,8,15,0.98)", borderColor: "rgba(255,255,255,0.06)" }}>
            {["Platform","Solutions","Resources","Pricing"].map(item => (
              <div key={item} className="py-2 text-sm font-semibold text-white/70 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>{item}</div>
            ))}
            <div className="flex gap-3 pt-3">
              <Link href="/dashboard" className="flex-1 text-center py-2.5 text-sm font-bold rounded-xl border" style={{ borderColor: "rgba(123,92,255,0.4)", color: "#A78BFA" }}>Check AI Score</Link>
              <Link href="/signup" className="flex-1 text-center py-2.5 text-sm font-black rounded-xl text-white uppercase" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>Demo</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Layered bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(123,92,255,0.18) 0%,transparent 70%)" }} />
          <div className="absolute top-1/3 left-0 w-96 h-96" style={{ background: "radial-gradient(circle,rgba(99,102,241,0.10) 0%,transparent 70%)" }} />
          <div className="absolute top-1/4 right-0 w-80 h-80" style={{ background: "radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 70%)" }} />
          {/* grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "80px 80px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div className="space-y-8">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
                style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                🇮🇳 AI Built for Indian Businesses
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight text-white">
                Reply to Every<br />
                Google Review{" "}
                <span className="relative inline-block">
                  <span style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Automatically
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg,#7c3aed,transparent)" }} />
                </span>
              </h1>

              <p className="text-lg leading-relaxed max-w-lg" style={{ color: "#8892B0" }}>
                Increase ratings, recover bad reviews, and reply in <strong className="text-white">Hindi, English & 18+ languages</strong> —
                all from one AI dashboard. No manual work.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <button className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 8px 32px rgba(123,92,255,0.4)" }}>
                    Start Free — 14 Days
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#C4B5FD" }}>
                    <Play className="h-4 w-4" />
                    View Live Demo
                  </button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3">
                {[
                  { e: "🔍", t: "Google Business" },
                  { e: "📱", t: "Play Store" },
                  { e: "💬", t: "WhatsApp" },
                  { e: "🇮🇳", t: "Made for India" },
                ].map(({ e, t }) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8892B0" }}>
                    {e} {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — 3D dashboard mockup */}
            <div className="relative flex items-center justify-center">
              {/* Glow behind card */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl"
                  style={{ background: "radial-gradient(circle,rgba(123,92,255,0.25) 0%,transparent 70%)" }} />
              </div>

              {/* Main card — 3D tilt */}
              <div className="relative dashboard-3d-card w-full max-w-md">
                {/* Floating badges */}
                <div className="absolute -top-6 -right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-xl float-1"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 8px 24px rgba(123,92,255,0.5)" }}>
                  <Zap className="h-3.5 w-3.5" /> Replied in 2s
                </div>
                <div className="absolute -bottom-5 -left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl float-2"
                  style={{ background: "rgba(8,12,30,0.95)", border: "1px solid rgba(123,92,255,0.3)", color: "#C4B5FD" }}>
                  <Globe className="h-3.5 w-3.5 text-violet-400" /> 20+ Languages
                </div>

                {/* Card body */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(13,17,32,0.95)", border: "1px solid rgba(123,92,255,0.25)", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                  {/* Header bar */}
                  <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: "linear-gradient(135deg,rgba(123,92,255,0.3),rgba(99,102,241,0.2))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white">ReviewPilot AI</span>
                    </div>
                    <div className="flex gap-1.5">
                      {["#EF4444","#F59E0B","#22C55E"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-px p-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                    {[
                      { v: "4.8★", l: "Rating",  c: "#FFB020" },
                      { v: "247",  l: "Reviews", c: "#7B5CFF" },
                      { v: "94%",  l: "Replied", c: "#22C55E" },
                    ].map(({ v, l, c }) => (
                      <div key={l} className="flex flex-col items-center py-3.5" style={{ background: "#0D1117" }}>
                        <span className="text-lg font-black" style={{ color: c }}>{v}</span>
                        <span className="text-[10px] font-medium mt-0.5" style={{ color: "#5D6590" }}>{l}</span>
                      </div>
                    ))}
                  </div>

                  {/* Review cards */}
                  <div className="p-4 space-y-3">
                    {/* 5-star */}
                    <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg,#7B5CFF,#6366F1)" }}>P</div>
                          <span className="text-xs font-bold text-white">Priya Sharma</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                      <p className="text-xs mb-2.5" style={{ color: "#8892B0" }}>"Food was incredible — best biryani in Delhi!"</p>
                      <div className="rounded-lg p-2.5" style={{ background: "rgba(123,92,255,0.1)", border: "1px solid rgba(123,92,255,0.2)" }}>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400 mb-1">
                          <Sparkles className="h-2.5 w-2.5" /> AI REPLY
                        </div>
                        <p className="text-xs" style={{ color: "#B0BBDB" }}>
                          "Thank you so much, Priya ji! 🙏 We're thrilled to be your favourite spot. Can't wait to see you again!"
                        </p>
                      </div>
                    </div>

                    {/* 1-star recovery */}
                    <div className="rounded-xl p-3.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>R</div>
                          <span className="text-xs font-bold text-white">Rahul K.</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>⚠ Urgent</span>
                        </div>
                        <div className="flex gap-0.5">
                          <Star className="h-3 w-3 fill-red-400 text-red-400" />
                          {[2,3,4,5].map(i => <Star key={i} className="h-3 w-3" style={{ color: "rgba(255,255,255,0.1)" }} />)}
                        </div>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#8892B0" }}>"Long wait time, cold food."</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}>
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Recovery Sent ✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
      <section className="py-12 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { to: 500, suffix: "+", label: "Businesses in India" },
              { to: 50,  suffix: "K+",label: "Reviews managed" },
              { to: 2,   suffix: "s", label: "Avg AI reply time" },
              { to: 98,  suffix: "%", label: "Satisfaction rate" },
            ].map(({ to, suffix, label }) => (
              <div key={label} className="space-y-1">
                <div className="text-3xl font-black" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  <Counter to={to} suffix={suffix} />
                </div>
                <div className="text-xs font-medium" style={{ color: "#5D6590" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ NEGATIVE REVIEW RECOVERY ══════════════════════════════════ */}
      <section id="features" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%,rgba(123,92,255,0.06) 0%,transparent 70%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section title */}
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}>
              🚀 Our #1 Differentiator
            </span>
            <h2 className="text-4xl font-black text-white">Recover Bad Reviews <span style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Automatically</span></h2>
            <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "#8892B0" }}>
              Most tools only reply. We help you fix the root problem — so angry customers come back and edit their review.
            </p>
          </div>

          {/* 5-step flow */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-16 relative">
            <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-px" style={{ background: "linear-gradient(90deg,rgba(123,92,255,0.2),rgba(123,92,255,0.5),rgba(34,197,94,0.5),rgba(34,197,94,0.2))" }} />
            {[
              { icon: AlertTriangle,  c: "#EF4444", bg: "rgba(239,68,68,0.1)",   label: "1★ Review Arrives",       n: "01" },
              { icon: Sparkles,       c: "#7B5CFF", bg: "rgba(123,92,255,0.1)",  label: "AI Detects Anger",        n: "02" },
              { icon: MessageSquare,  c: "#00CFFF", bg: "rgba(0,207,255,0.1)",   label: "WhatsApp Recovery Sent",  n: "03" },
              { icon: HeartHandshake, c: "#F59E0B", bg: "rgba(245,158,11,0.1)",  label: "Issue Resolved",          n: "04" },
              { icon: Star,           c: "#22C55E", bg: "rgba(34,197,94,0.1)",   label: "Customer Edits Review",   n: "05" },
            ].map(({ icon: Icon, c, bg, label, n }) => (
              <div key={n} className="flex flex-col items-center gap-3 text-center z-10 group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                    style={{ background: bg, border: `1px solid ${c}30`, boxShadow: `0 8px 24px ${c}20` }}>
                    <Icon className="h-6 w-6" style={{ color: c }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: c }}>
                    {n}
                  </div>
                </div>
                <p className="text-xs font-bold text-white max-w-[100px] leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* 3D Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap,            c: "#7B5CFF", title: "Smart AI Routing",       desc: "5★ auto-posts a thank-you. 1-2★ triggers private resolution — protecting your public score." },
              { icon: MessageSquare,  c: "#22C55E", title: "WhatsApp Recovery",      desc: "Private WhatsApp to the unhappy customer with a personal apology and a resolution offer." },
              { icon: Gift,           c: "#F59E0B", title: "Auto Coupon Offer",      desc: "Attach a discount voucher or free item to the recovery message — turning anger into loyalty." },
              { icon: Phone,          c: "#EF4444", title: "AI Call Scheduling",     desc: "For high-value complaints, automatically schedule a callback with the business owner." },
              { icon: Shield,         c: "#6366F1", title: "Competitor Tracker",     desc: "When a nearby competitor's rating drops — you get notified to capture their customers." },
              { icon: BarChart3,      c: "#10B981", title: "Sentiment Heatmap",      desc: "See which branch, day, or menu item is generating the most negative feedback and fix it." },
            ].map(({ icon: Icon, c, title, desc }) => (
              <div key={title} className="card-3d rounded-2xl p-5 cursor-default transition-all duration-300"
                style={{ background: "rgba(13,17,32,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${c}18`, border: `1px solid ${c}25` }}>
                  <Icon className="h-5 w-5" style={{ color: c }} />
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6A7490" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════ */}
      <section id="how" className="py-28 relative" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }}>How It Works</span>
            <h2 className="text-4xl font-black text-white">Live in under 5 minutes</h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "#8892B0" }}>No technical skills. Connect, configure, and let the AI handle everything.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[28%] right-[28%] h-px" style={{ background: "linear-gradient(90deg,#7c3aed,#6366f1)" }} />
            {[
              { n: "1", Icon: Globe,     title: "Connect",         desc: "Link your Google Business Profile. One click — no code, no plugins." },
              { n: "2", Icon: Sparkles,  title: "AI Replies",      desc: "AI reads every review and crafts a perfect, on-brand reply in the right language." },
              { n: "3", Icon: TrendingUp,title: "Recover & Grow",  desc: "Handle negative reviews privately, approve replies, watch your rating climb." },
            ].map(({ n, Icon, title, desc }) => (
              <div key={n} className="text-center space-y-4 group">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2"
                    style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.25)", boxShadow: "0 8px 30px rgba(123,92,255,0.15)" }}>
                    <Icon className="h-9 w-9 text-violet-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>{n}</div>
                </div>
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#6A7490" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INDUSTRY TEMPLATES ════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80" }}>Industry Templates</span>
            <h2 className="text-4xl font-black text-white">Pre-built for your business type</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { Icon: Utensils,    l: "Restaurant",    c: "#F97316" },
              { Icon: Hotel,       l: "Hotel",         c: "#6366F1" },
              { Icon: Stethoscope, l: "Clinic",        c: "#10B981" },
              { Icon: Dumbbell,    l: "Gym",           c: "#EF4444" },
              { Icon: Scissors,    l: "Salon",         c: "#EC4899" },
              { Icon: Smartphone,  l: "App Developer", c: "#7C3AED" },
            ].map(({ Icon, l, c }) => (
              <div key={l} className="card-3d flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer text-center transition-all duration-300"
                style={{ background: "rgba(13,17,32,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                  <Icon className="h-6 w-6" style={{ color: c }} />
                </div>
                <span className="text-xs font-bold text-white">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AI TONE SELECTION ═════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="absolute pointer-events-none inset-0" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 100%,rgba(123,92,255,0.08) 0%,transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }}>AI Tone</span>
            <h2 className="text-4xl font-black text-white">Reply in <span style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Brand Voice</span></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { e: "😊", tone: "Friendly",     c: "#22C55E", sample: "Thank you! We're so happy you enjoyed it — come back soon! 🙌" },
              { e: "💼", tone: "Professional", c: "#6366F1", sample: "We appreciate your feedback and remain committed to excellence." },
              { e: "✨", tone: "Luxury",        c: "#7C3AED", sample: "Your kind words mean the world to us. We eagerly await your return." },
              { e: "😄", tone: "Funny",         c: "#F59E0B", sample: "You just made our team do a happy dance! Thanks so much! 💃" },
              { e: "🤝", tone: "Empathetic",    c: "#EF4444", sample: "We're truly sorry. Your experience matters and we want to make it right." },
            ].map(({ e, tone, c, sample }) => (
              <div key={tone} className="card-3d-deep rounded-2xl p-4 cursor-pointer"
                style={{ background: "rgba(13,17,32,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                  style={{ background: `${c}18`, border: `1px solid ${c}25` }}>{e}</div>
                <p className="text-sm font-black text-white mb-2">{tone}</p>
                <p className="text-[11px] leading-relaxed italic" style={{ color: "#5D6590" }}>"{sample}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER ════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(0,207,255,0.10)", border: "1px solid rgba(0,207,255,0.25)", color: "#67E8F9" }}>Before vs After</span>
            <h2 className="text-4xl font-black text-white">See the difference it makes</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Before */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                  <X className="h-4 w-4 text-red-400" />
                </div>
                <span className="font-black text-red-400">Without ReviewPilot</span>
              </div>
              <ul className="space-y-3">
                {["Check reviews manually every morning","30–60 min writing replies by hand","Miss negative reviews for days","No Hindi / regional language replies","Bad reviews go unanswered for weeks","Rating stuck at 3.8★"].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: "#F87171" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/50 flex-shrink-0 mt-2" />{t}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <span className="font-black text-green-400">With ReviewPilot</span>
              </div>
              <ul className="space-y-3">
                {["AI replies automatically in 2 seconds","Zero time — replies happen while you sleep","Instant alert + private WhatsApp for 1★","Auto-detected Hindi, Tamil, English replies","Negative reviews resolved privately","Rating climbs to 4.7★ in 90 days"].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: "#4ADE80" }}>
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(255,176,32,0.10)", border: "1px solid rgba(255,176,32,0.25)", color: "#FCD34D" }}>Testimonials</span>
            <h2 className="text-4xl font-black text-white">Trusted by Indian businesses</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Vikram Malhotra", role: "Restaurant Owner, Delhi", text: "We were manually replying to 50+ Google reviews a week. ReviewPilot handles everything in Hindi and English now. Our rating went from 4.0 to 4.7 in just 60 days.", stars: 5 },
              { name: "Priya Nair",      role: "Clinic Manager, Bangalore", text: "The negative review recovery feature is incredible. A patient left a 1-star review, WhatsApp went out, we resolved it, and they changed to 4 stars the same day.", stars: 5 },
              { name: "Sundar Krishnan", role: "App Developer, Chennai",  text: "Play Store review management was eating 2 hours a day. Now AI handles all replies in Tamil and English. App rating improved from 3.6 to 4.3 in one month.", stars: 5 },
            ].map(({ name, role, text, stars }) => (
              <div key={name} className="card-3d rounded-2xl p-6 space-y-4 cursor-default"
                style={{ background: "rgba(13,17,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#8892B0" }}>"{text}"</p>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#5D6590" }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 relative" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-4">
            <span className="inline-block text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase" style={{ background: "rgba(123,92,255,0.12)", border: "1px solid rgba(123,92,255,0.3)", color: "#A78BFA" }}>FAQ</span>
            <h2 className="text-4xl font-black text-white">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%,rgba(123,92,255,0.14) 0%,transparent 70%)" }} />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-7">
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Start recovering your<br />reputation today
          </h2>
          <p className="text-base" style={{ color: "#8892B0" }}>
            Join 500+ Indian businesses using ReviewPilot to grow their Google rating on autopilot.
          </p>
          <Link href="/signup">
            <button className="inline-flex items-center gap-2.5 px-12 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 12px 40px rgba(123,92,255,0.4)" }}>
              Start 14-day Free Trial
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <p className="text-xs" style={{ color: "#3A4570" }}>No credit card · Cancel anytime · 14 days free</p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer className="py-14" style={{ background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-black text-white text-base">ReviewPilot</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#3A4570" }}>
                AI Reputation Recovery for Indian Businesses. Manage every Google, Play Store & WhatsApp review from one dashboard.
              </p>
              <span className="inline-block text-xs font-semibold" style={{ color: "#7B5CFF" }}>🇮🇳 Made for India</span>
            </div>
            {[
              { title: "Platform", links: ["AI Reply Engine","Auto-Reply Bot","Negative Recovery","Analytics","QR Reviews","Campaigns"] },
              { title: "Solutions", links: ["Restaurant","Hotel","Clinic","Gym","Salon","App Developer"] },
              { title: "Company", links: ["Pricing","Documentation","API Reference","Privacy Policy","Terms of Service"] },
            ].map(({ title, links }) => (
              <div key={title} className="space-y-4">
                <h4 className="text-sm font-black text-white">{title}</h4>
                <ul className="space-y-2">
                  {links.map(l => <li key={l}><a href="#" className="text-xs transition-colors hover:text-violet-400" style={{ color: "#3A4570" }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "#3A4570" }}>
            <p>© 2025 ReviewPilot. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-violet-400" />20+ Languages</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3 text-violet-400" />WhatsApp Automation</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-violet-400" />GDPR Safe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
