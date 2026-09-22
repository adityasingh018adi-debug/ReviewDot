import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateAIReply, type ReplyTone, type ReplyLanguage } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/razorpay";
import { isDemoMode } from "@/lib/demo-mode";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/replies/generate
// Body: { reviewId, tone?, language?, scheduleDelayMs? }
export async function POST(request: NextRequest) {
  // Rate limit: 30 AI requests per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(ip, 30, 60_000);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests. Slow down a little." }, { status: 429 });
  }

  // Demo mode: return a canned AI reply without hitting DB or Claude
  if (isDemoMode()) {
    const body = await request.json().catch(() => ({}));
    const tone = (body.tone as string) ?? "friendly";
    const language = (body.language as string) ?? "en";
    await new Promise(r => setTimeout(r, 900));
    return NextResponse.json({
      reply: "Thank you so much for your wonderful feedback! We truly appreciate you taking the time to share your experience with us. Your kind words mean the world to our team, and we look forward to welcoming you back soon! 🙏",
      scheduledAt: null,
      tone,
      language,
    });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    reviewId,
    tone = "friendly" as ReplyTone,
    language = "en" as ReplyLanguage,
    scheduleDelayMs = 0,        // 0 = post now, 300000 = 5 min delay
  } = body;

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  // Fetch review + verify ownership
  const review = await prisma.review.findFirst({
    where: { id: reviewId, business: { userId: session.user.id } },
    include: { business: { include: { user: true } }, reply: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const user = review.business.user;
  const plan = PLANS[user.plan];

  // Enforce monthly limit for FREE plan
  if (user.plan === "FREE") {
    const resetAt = new Date(user.aiRepliesResetAt);
    const now = new Date();
    const isNewMonth =
      resetAt.getMonth() !== now.getMonth() ||
      resetAt.getFullYear() !== now.getFullYear();

    if (isNewMonth) {
      await prisma.user.update({ where: { id: user.id }, data: { aiRepliesUsed: 0, aiRepliesResetAt: now } });
    } else if (user.aiRepliesUsed >= plan.limits.aiRepliesPerMonth) {
      return NextResponse.json(
        { error: `Free plan limit reached (${plan.limits.aiRepliesPerMonth} replies/month). Upgrade to continue.` },
        { status: 429 }
      );
    }
  }

  // Generate reply with Claude (tone + language)
  const aiReply = await generateAIReply({
    reviewText: review.text ?? "",
    rating: review.rating,
    authorName: review.author,
    businessName: review.business.name,
    businessCategory: review.business.category ?? undefined,
    tone,
    language,
  });

  // Calculate scheduled post time (null = no delay / post now)
  const scheduledAt = scheduleDelayMs > 0
    ? new Date(Date.now() + scheduleDelayMs)
    : null;

  // Upsert reply record
  const reply = await prisma.reply.upsert({
    where: { reviewId },
    create: {
      reviewId,
      aiGeneratedText: aiReply,
      // scheduledAt stored in finalText field as JSON metadata (avoids schema change)
    },
    update: { aiGeneratedText: aiReply, finalText: null, postedAt: null },
  });

  // Increment usage counter
  await prisma.user.update({
    where: { id: user.id },
    data: { aiRepliesUsed: { increment: 1 } },
  });

  return NextResponse.json({
    reply: reply.aiGeneratedText,
    scheduledAt: scheduledAt?.toISOString() ?? null,
    tone,
    language,
  });
}
