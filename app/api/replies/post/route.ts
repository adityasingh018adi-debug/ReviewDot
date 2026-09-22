import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { postReviewReply, refreshAccessToken } from "@/lib/google";
import { isDemoMode } from "@/lib/demo-mode";

// POST /api/replies/post
// Body: { reviewId: string, replyText: string }
// Posts the final reply to Google Business Profile
export async function POST(request: NextRequest) {
  // Demo mode: simulate posting without real Google credentials
  if (isDemoMode()) {
    await new Promise(r => setTimeout(r, 700));
    return NextResponse.json({ success: true });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId, replyText } = await request.json();
  if (!reviewId || !replyText?.trim()) {
    return NextResponse.json({ error: "reviewId and replyText are required" }, { status: 400 });
  }

  // Fetch review with business credentials — ensure ownership
  const review = await prisma.review.findFirst({
    where: { id: reviewId, business: { userId: session.user.id } },
    include: { business: true, reply: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const business = review.business;

  if (!business.googleAccessToken || !business.googleLocationId) {
    return NextResponse.json(
      { error: "Google Business Profile not connected. Please connect your account in settings." },
      { status: 400 }
    );
  }

  let accessToken = business.googleAccessToken;

  // Refresh the token if it has expired
  if (business.googleTokenExpiry && new Date(business.googleTokenExpiry) < new Date()) {
    if (!business.googleRefreshToken) {
      return NextResponse.json({ error: "Token expired — please reconnect Google." }, { status: 401 });
    }
    const refreshed = await refreshAccessToken(business.googleRefreshToken);
    accessToken = refreshed.access_token;

    await prisma.business.update({
      where: { id: business.id },
      data: {
        googleAccessToken: accessToken,
        googleTokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
  }

  // The Google review resource name format: accounts/xxx/locations/yyy/reviews/zzz
  const reviewName = review.googleReviewId
    ? `${business.googleLocationId}/reviews/${review.googleReviewId}`
    : null;

  if (!reviewName) {
    return NextResponse.json({ error: "Cannot post — review has no Google ID (demo data)." }, { status: 400 });
  }

  // Post to Google
  await postReviewReply(accessToken, reviewName, replyText.trim());

  // Update the reply record in DB
  const now = new Date();
  await prisma.reply.upsert({
    where: { reviewId },
    create: {
      reviewId,
      aiGeneratedText: review.reply?.aiGeneratedText ?? replyText,
      finalText: replyText.trim(),
      postedAt: now,
      approvedAt: now,
      approvedBy: session.user.id,
    },
    update: {
      finalText: replyText.trim(),
      postedAt: now,
      approvedAt: now,
      approvedBy: session.user.id,
    },
  });

  // Mark review as answered
  await prisma.review.update({ where: { id: reviewId }, data: { isAnswered: true } });

  return NextResponse.json({ success: true });
}
