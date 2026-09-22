"use client";

import { useState } from "react";
import {
  BookOpen, MessageCircle, Mail, ChevronDown, ChevronRight,
  Zap, Star, Globe, Shield, Sparkles, QrCode, Send,
  ExternalLink, CheckCircle2, Clock, Search,
} from "lucide-react";

/* ── FAQ data ─────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "How do I connect my Google Business Profile?",
    a: "Go to Settings → Integrations and click 'Connect Google Business'. You'll be redirected to sign in with the Google account that manages your business listing. It takes under 60 seconds.",
  },
  {
    q: "Why isn't my WhatsApp campaign delivering?",
    a: "WhatsApp via Twilio requires the recipient to first opt in by messaging your Twilio Sandbox number. For production use, you need a Twilio WhatsApp Business-approved number. Check Settings → Integrations for your Twilio status.",
  },
  {
    q: "How does the AI choose the reply language?",
    a: "By default, the AI auto-detects the review language and replies in the same language. You can override this in AI Replies → Reply Language before generating or posting.",
  },
  {
    q: "Can I approve replies before they go live?",
    a: "Yes. In Auto-Reply settings you can set the minimum star rating for auto-posting (e.g. only 5★ auto-posts) and require manual approval for everything below that threshold.",
  },
  {
    q: "What is the Negative Review Recovery flow?",
    a: "When a 1–2★ review arrives, the AI flags it as urgent. You can send a private WhatsApp to the customer offering support or a refund. If the issue is resolved, the customer can update their review.",
  },
  {
    q: "How do I embed the reviews widget on my website?",
    a: "Go to Widget → choose your style → copy the embed code snippet. Paste it anywhere in your website's HTML. The widget auto-updates as new reviews come in.",
  },
  {
    q: "I accidentally posted the wrong reply. Can I undo it?",
    a: "Once posted to Google, replies can only be edited or deleted directly in Google Business Profile or Google Maps. ReviewPilot will reflect the update on the next sync.",
  },
  {
    q: "What counts as an 'AI reply' toward my monthly limit?",
    a: "Each AI-generated reply (via the Generate button or Auto-Reply) counts as one usage. Re-generating the same review also uses one credit. Manually typed replies do NOT count.",
  },
];

/* ── Docs / guides ────────────────────────────────────────────────────────── */
const DOCS = [
  { icon: Zap,        color: "#7B5CFF", title: "Quick Start",           desc: "Connect your first Google Business location in 3 steps." },
  { icon: Sparkles,   color: "#00CFFF", title: "AI Replies Guide",      desc: "Tone selection, language settings, scheduling & batch posting." },
  { icon: Globe,      color: "#22C55E", title: "Multilingual Setup",    desc: "How to configure 20+ language auto-detection for replies." },
  { icon: Shield,     color: "#EF4444", title: "Negative Review Recovery", desc: "Step-by-step recovery flow: detect → message → resolve." },
  { icon: QrCode,     color: "#F59E0B", title: "QR Code Reviews",       desc: "Generate, print and track QR codes for in-store review collection." },
  { icon: Send,       color: "#EC4899", title: "WhatsApp Campaigns",    desc: "Twilio setup, sandbox opt-in, and sending review requests." },
  { icon: Star,       color: "#FFB020", title: "Auto-Reply Bot",        desc: "Set up fully automated posting with delay and rating filters." },
  { icon: BookOpen,   color: "#6366F1", title: "API Reference",         desc: "REST endpoints, authentication, webhooks, and rate limits." },
];

/* ── Status ───────────────────────────────────────────────────────────────── */
const STATUS_ITEMS = [
  { label: "Google API",         ok: true  },
  { label: "AI Reply Engine",    ok: true  },
  { label: "WhatsApp (Twilio)",  ok: true  },
  { label: "Email (Resend)",     ok: true  },
  { label: "Webhook Delivery",   ok: true  },
];

/* ── FaqItem ────────────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className="rounded-xl cursor-pointer transition-all"
      style={{ background: "#0D1117", border: "1px solid #1A2035" }}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 transition-transform duration-200"
          style={{ color: "#5D6590", transform: open ? "rotate(180deg)" : "none" }}
        />
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: "#8892B0" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export function SupportPage() {
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });

  const filteredFaq = FAQ.filter(
    (f) =>
      !search ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">Help & Support</h1>
        <p className="text-sm mt-0.5" style={{ color: "#5D6590" }}>
          Documentation, FAQ, and direct support for ReviewPilot
        </p>
      </div>

      {/* Quick contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: BookOpen,    color: "#7B5CFF", bg: "rgba(123,92,255,0.1)",
            title: "Documentation",
            desc: "Guides, tutorials, and API reference",
            action: "View Docs →",
          },
          {
            icon: MessageCircle, color: "#22C55E", bg: "rgba(34,197,94,0.1)",
            title: "Live Chat",
            desc: "Mon–Fri 9am–6pm IST · Avg reply < 5 min",
            action: "Start Chat →",
          },
          {
            icon: Mail,        color: "#00CFFF", bg: "rgba(0,207,255,0.1)",
            title: "Email Support",
            desc: "support@reviewpilot.in · Reply within 24h",
            action: "Send Email →",
          },
        ].map(({ icon: Icon, color, bg, title, desc, action }) => (
          <div key={title}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: bg }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6A7490" }}>{desc}</p>
            </div>
            <button className="text-xs font-bold self-start" style={{ color }}>
              {action}
            </button>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col — FAQ + Docs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Documentation grid */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#1A2035" }}>
              <h2 className="font-bold text-white text-sm">Documentation & Guides</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-0.5 p-1">
              {DOCS.map(({ icon: Icon, color, title, desc }) => (
                <button key={title}
                  className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:brightness-125"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#0C1828"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <ExternalLink className="h-3 w-3" style={{ color: "#3A4570" }} />
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6A7490" }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: "#1A2035" }}>
              <h2 className="font-bold text-white text-sm">Frequently Asked Questions</h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#5D6590" }} />
                <input
                  type="text"
                  placeholder="Search FAQ…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg outline-none"
                  style={{ background: "#060818", border: "1px solid #1E2540", color: "#C8D0E7" }}
                />
              </div>
            </div>
            <div className="p-4 space-y-2">
              {filteredFaq.length === 0 ? (
                <p className="text-center py-6 text-sm" style={{ color: "#5D6590" }}>No matching questions found.</p>
              ) : (
                filteredFaq.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)
              )}
            </div>
          </div>
        </div>

        {/* Right col — contact form + system status */}
        <div className="space-y-5">

          {/* Contact form */}
          <div className="rounded-2xl p-5" style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <h2 className="font-bold text-white text-sm mb-4">Send us a message</h2>

            {sent ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-400" />
                <p className="font-semibold text-white">Message sent!</p>
                <p className="text-xs" style={{ color: "#6A7490" }}>
                  We'll reply to your email within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ subject: "", message: "" }); }}
                  className="text-xs font-semibold mt-2"
                  style={{ color: "#7B5CFF" }}>
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#6A7490" }}>Subject</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. WhatsApp not sending"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: "#060818", border: "1px solid #1E2540", color: "#C8D0E7" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#6A7490" }}>Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue in detail…"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                    style={{ background: "#060818", border: "1px solid #1E2540", color: "#C8D0E7" }}
                  />
                </div>
                <button type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#7B5CFF,#6366F1)" }}>
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* System status */}
          <div className="rounded-2xl p-5" style={{ background: "#0D1117", border: "1px solid #1A2035" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">System Status</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                All systems operational
              </span>
            </div>
            <div className="space-y-2.5">
              {STATUS_ITEMS.map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#8892B0" }}>{label}</span>
                  <div className="flex items-center gap-1.5">
                    {ok
                      ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400" /><span className="text-xs text-green-400 font-semibold">Online</span></>
                      : <><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /><span className="text-xs text-red-400 font-semibold">Down</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid #1A2035" }}>
              <Clock className="h-3.5 w-3.5" style={{ color: "#5D6590" }} />
              <span className="text-xs" style={{ color: "#5D6590" }}>Last checked: just now</span>
            </div>
          </div>

          {/* Response time SLA */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(123,92,255,0.08)", border: "1px solid rgba(123,92,255,0.2)" }}>
            <p className="text-xs font-bold text-violet-300 mb-2">Support Response Times</p>
            <div className="space-y-1.5">
              {[
                { plan: "Live Chat",    time: "< 5 min",  color: "#22C55E" },
                { plan: "Email",        time: "< 24 hrs", color: "#7B5CFF" },
                { plan: "Critical Bug", time: "< 2 hrs",  color: "#EF4444" },
              ].map(({ plan, time, color }) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#8892B0" }}>{plan}</span>
                  <span className="text-xs font-bold" style={{ color }}>{time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
