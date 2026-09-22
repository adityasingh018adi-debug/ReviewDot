"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Star, Sparkles, Copy, Check, ExternalLink, RefreshCw,
  ChevronRight, Heart, MessageSquare, ArrowLeft,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "rate" | "generating" | "result";

interface PlatformConfig {
  name: string;
  url: string;
  color: string;
  bg: string;
  borderColor: string;
  logo: React.ReactNode;
}

// ─── Platform configs ─────────────────────────────────────────────────────────

const PLATFORMS: Record<string, PlatformConfig> = {
  google: {
    name: "Google Reviews",
    url: "https://search.google.com/local/writereview",
    color: "text-blue-700",
    bg: "bg-blue-600 hover:bg-blue-700",
    borderColor: "border-blue-200",
    logo: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  zomato: {
    name: "Zomato",
    url: "https://www.zomato.com",
    color: "text-red-600",
    bg: "bg-red-500 hover:bg-red-600",
    borderColor: "border-red-200",
    logo: (
      <div className="h-5 w-5 bg-red-500 rounded shrink-0 flex items-center justify-center">
        <span className="text-white font-black text-sm leading-none">Z</span>
      </div>
    ),
  },
  justdial: {
    name: "Justdial",
    url: "https://www.justdial.com",
    color: "text-orange-600",
    bg: "bg-orange-500 hover:bg-orange-600",
    borderColor: "border-orange-200",
    logo: (
      <div className="h-5 w-5 rounded shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF6600,#ff8c33)" }}>
        <span className="text-white font-black text-[10px] leading-none">JD</span>
      </div>
    ),
  },
  tripadvisor: {
    name: "TripAdvisor",
    url: "https://www.tripadvisor.com",
    color: "text-emerald-700",
    bg: "bg-emerald-600 hover:bg-emerald-700",
    borderColor: "border-emerald-200",
    logo: (
      <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-xs">TA</span>
      </div>
    ),
  },
};

// ─── Mock AI review generator ─────────────────────────────────────────────────

const GENERATED_REVIEWS: Record<number, string[]> = {
  5: [
    "Absolutely incredible experience! The food was exceptional — every dish was bursting with authentic flavour and prepared with obvious care and skill. The staff were genuinely warm and attentive without being intrusive. The atmosphere felt special from the moment we walked in. Hands down one of the best meals I've had in a long time. Will absolutely be back and have already recommended it to friends!",
    "Wow — this place completely exceeded my expectations! Everything was top-notch: the flavours were spot on, the portions were generous, and the service was outstanding. You could tell the team really takes pride in what they do. A must-visit if you're in the area — I've already made my next reservation!",
    "A truly memorable dining experience from start to finish. The food was exceptional, beautifully presented and incredibly flavourful. The staff made us feel genuinely welcome and went out of their way to ensure we had a wonderful time. This is exactly the kind of place you want to discover — and keep coming back to!",
  ],
  4: [
    "Really enjoyed our visit! The food quality was excellent and the service was friendly and prompt. A couple of small things could be polished but overall a very satisfying experience. We'll definitely be returning — the dishes we had were some of the best we've tried in a while.",
    "Great experience overall! The food was delicious — really authentic flavours and generous portions. Service was attentive and the atmosphere was pleasant. There's a reason this place gets such great reviews. We'll be back for sure!",
  ],
  3: [
    "Decent visit overall. The food was good and the staff were polite. A few things could be better — the wait was a bit longer than expected and the ambiance could use some work. But the food quality itself was solid and I can see why people like it. Would consider returning to give it another try.",
    "Mixed experience, but the positives outweigh the negatives. Food was tasty and reasonably priced. Service was okay — could be more attentive. Wouldn't say it's a destination spot but worth a visit if you're nearby.",
  ],
  2: [
    "Our visit was a bit of a letdown. While the staff were friendly, the food didn't quite meet our expectations — the flavours were a bit flat and the wait time was longer than it should be. It has potential and I hope things improve, as I'm willing to give it another chance.",
    "Disappointing experience this time around. The food was average and took a long time to arrive. The service was polite enough but overwhelmed. Perhaps we caught them on a bad day — I'll try again before making a final judgement.",
  ],
  1: [
    "Unfortunately, our experience wasn't good. The food was underwhelming and didn't meet basic expectations for the price. When we raised concerns, we didn't feel heard. I hope management takes this as constructive feedback — there's clearly room for improvement in both food quality and customer service.",
  ],
};

function getMockReview(rating: number, notes: string): string {
  const pool = GENERATED_REVIEWS[rating] ?? GENERATED_REVIEWS[3];
  let base = pool[Math.floor(Math.random() * pool.length)];
  if (notes.trim()) {
    // Weave in their specific note
    const extras: Record<number, string> = {
      5: `The ${notes.trim().toLowerCase()} in particular was absolutely fantastic. `,
      4: `I especially enjoyed the ${notes.trim().toLowerCase()}. `,
      3: `The ${notes.trim().toLowerCase()} was a highlight. `,
      2: `Even though the ${notes.trim().toLowerCase()} was okay, `,
      1: `The ${notes.trim().toLowerCase()} didn't impress either. `,
    };
    const insert = extras[rating] ?? "";
    const mid = Math.floor(base.length / 2);
    const sentenceEnd = base.indexOf(". ", mid);
    if (sentenceEnd !== -1 && insert) {
      base = base.slice(0, sentenceEnd + 2) + insert + base.slice(sentenceEnd + 2);
    }
  }
  return base;
}

const RATING_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Terrible", color: "text-red-600", emoji: "😞" },
  2: { label: "Poor", color: "text-orange-600", emoji: "😕" },
  3: { label: "Okay", color: "text-yellow-600", emoji: "😐" },
  4: { label: "Good", color: "text-lime-600", emoji: "😊" },
  5: { label: "Excellent!", color: "text-emerald-600", emoji: "🤩" },
};

// ─── Main component ────────────────────────────────────────────────────────────

export function ReviewKiosk({ businessName = "Sharma's Kitchen", businessCategory = "Restaurant" }) {
  const searchParams = useSearchParams();
  const platformId = searchParams.get("platform") ?? "google";
  const platform = PLATFORMS[platformId] ?? PLATFORMS.google;

  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState(1);

  // Animate dots during generation
  useEffect(() => {
    if (step !== "generating") return;
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 400);
    return () => clearInterval(id);
  }, [step]);

  const handleGenerate = useCallback(async () => {
    if (rating === 0) return;
    setStep("generating");
    // Simulate AI latency
    await new Promise((res) => setTimeout(res, 2200));
    setGenerated(getMockReview(rating, notes));
    setStep("result");
  }, [rating, notes]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [generated]);

  const handleRegenerate = useCallback(async () => {
    setStep("generating");
    await new Promise((res) => setTimeout(res, 1800));
    setGenerated(getMockReview(rating, notes));
    setStep("result");
  }, [rating, notes]);

  const displayRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[displayRating];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-gray-50 flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-md">

        {/* Business header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg mb-3 glow-violet">
            <span className="text-white text-2xl font-black">{businessName[0]}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-sm text-gray-500">{businessCategory}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {platform.logo}
            <span className="text-sm font-medium text-gray-600">Review for {platform.name}</span>
          </div>
        </div>

        {/* ── Step: Rate ── */}
        {step === "rate" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">How was your experience?</h2>
              <p className="text-gray-500 text-sm mt-1">Tap a star to rate us</p>
            </div>

            {/* Star selector */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                  className="transition-transform hover:scale-125 focus:outline-none"
                  style={{ transform: i <= displayRating ? "scale(1.1)" : "scale(1)" }}
                >
                  <Star
                    className={`h-12 w-12 transition-all duration-150 ${
                      i <= displayRating
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating label */}
            <div className="text-center h-8">
              {displayRating > 0 && ratingInfo && (
                <div className={`text-lg font-bold ${ratingInfo.color} animate-fade-in`}>
                  {ratingInfo.emoji} {ratingInfo.label}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anything specific you loved? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. butter chicken, great service, amazing ambiance…"
                rows={2}
                className="w-full text-sm rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 px-4 py-3 resize-none outline-none placeholder:text-gray-300 transition-all"
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={rating === 0}
              className="w-full h-12 text-base font-semibold gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-violet-200 disabled:opacity-40 disabled:shadow-none transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Generate My Review ✨
            </Button>

            <p className="text-center text-xs text-gray-400">
              AI will write a polished review based on your rating. You can edit it before posting.
            </p>
          </div>
        )}

        {/* ── Step: Generating ── */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center glow-violet">
              <Sparkles className="h-8 w-8 text-violet-600 animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">
                Crafting your review{".".repeat(dots)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">AI is writing a perfect {rating}-star review for you</p>
            </div>
            {/* Typing dots */}
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full typing-dot" />
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full typing-dot" />
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full typing-dot" />
            </div>
            {/* Fake progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: "75%" }} />
            </div>
          </div>
        )}

        {/* ── Step: Result ── */}
        {step === "result" && (
          <div className="space-y-4 animate-fade-in">
            {/* Result card */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              {/* Success header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Your review is ready!</p>
                  <p className="text-xs text-emerald-100">AI crafted · {rating} stars · {generated.length} characters</p>
                </div>
              </div>

              {/* Review text */}
              <div className="p-5">
                <div className="flex items-center gap-0.5 mb-3">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-2 font-medium">{RATING_LABELS[rating]?.label}</span>
                </div>

                <p className="text-gray-800 text-sm leading-relaxed mb-4">{generated}</p>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopy}
                    className={`flex-1 h-10 gap-2 text-sm font-semibold rounded-xl transition-all ${
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
                  >
                    {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Review</>}
                  </Button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 h-10 px-4 text-sm text-gray-500 hover:text-violet-700 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New
                  </button>
                </div>
              </div>
            </div>

            {/* Post on platform */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Now paste & post on {platform.name}:
              </p>
              <Button
                className={`w-full h-12 gap-3 text-base font-semibold rounded-xl text-white ${platform.bg}`}
                onClick={() => window.open(platform.url, "_blank")}
              >
                {platform.logo}
                Open {platform.name}
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
              <p className="text-xs text-gray-400 mt-2.5 flex items-start gap-1.5">
                <span className="text-violet-500 font-bold">💡</span>
                Copy the review first, then tap the button — paste it in the review box that opens
              </p>
            </div>

            {/* Other platforms */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Also post on</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(PLATFORMS)
                  .filter(([id]) => id !== platformId)
                  .map(([id, p]) => (
                    <button
                      key={id}
                      onClick={() => window.open(p.url, "_blank")}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                      {p.logo}
                      {p.name}
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Start over */}
            <button
              onClick={() => { setStep("rate"); setRating(0); setNotes(""); setGenerated(""); setCopied(false); }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-violet-600 mx-auto py-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Rate again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <span className="text-violet-500 font-semibold">ReviewPilot AI</span>
            {" "}· Review is AI-assisted, feel free to edit before posting
          </p>
        </div>

      </div>
    </div>
  );
}
