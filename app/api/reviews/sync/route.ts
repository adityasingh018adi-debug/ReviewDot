import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchReviews, refreshAccessToken, starRatingToNumber } from "@/lib/google";
import { generateAIReply } from "@/lib/claude";
import { sendNegativeReviewAlert } from "@/lib/twilio";
import { isDemoMode } from "@/lib/demo-mode";

// POST /api/reviews/sync
// Pulls latest reviews from Google Business Profile and generates AI replies
// Called manually from the dashboard or by Vercel Cron
export async function POST(request: NextRequest) {
  // Demo mode: nothing to sync, return mock response
  if (isDemoMode()) {
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json({ synced: 0, newReviews: 0 });
  }

  // For cron calls, verify the Authorization header
  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all businesses to sync (all for cron, just this user's for manual)
  const businesses = await prisma.business.findMany({
    where: isCron
      ? { googleAccessToken: { not: null } }
      : { userId: session!.user.id, googleAccessToken: { not: null } },
    include: { user: true, alerts: true },
  });

  let totalNew = 0;
  const errors: string[] = [];

  for (const business of businesses) {
    try {
      let accessToken = business.googleAccessToken!;

      // Refresh expired tokens
      if (business.googleTokenExpiry && new Date(business.googleTokenExpiry) < new Date()) {
        if (!business.googleRefreshToken) continue;
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

      // Pull reviews from Google
      const locationName = business.googleLocationId!;
      const { reviews: googleReviews } = await fetchReviews(accessToken, locationName);

      for (const gr of googleReviews) {
        const rating = starRatingToNumber(gr.starRating);
        const alreadyExists = await prisma.review.findUnique({
          where: { googleReviewId: gr.reviewId },
        });

        if (alreadyExists) continue;

        // Save the new review
        const review = await prisma.review.create({
          data: {
            businessId: business.id,
            googleReviewId: gr.reviewId,
            author: gr.reviewer.displayName,
            authorPhotoUrl: gr.reviewer.profilePhotoUrl,
            rating,
            text: gr.comment ?? null,
            platform: "GOOGLE",
            reviewDate: new Date(gr.createTime),
            isAnswered: !!gr.reviewReply,
          },
        });

        // Auto-generate AI reply (skip if already has a Google reply)
        if (!gr.reviewReply) {
          const aiReply = await generateAIReply({
            reviewText: gr.comment ?? "",
            rating,
            authorName: gr.reviewer.displayName,
            businessName: business.name,
            businessCategory: business.category ?? undefined,
          });

          await prisma.reply.create({
            data: { reviewId: review.id, aiGeneratedText: aiReply },
          });

          // WhatsApp alert for negative reviews (Growth plan)
          const whatsappAlert = business.alerts.find(
            (a) => a.type === "WHATSAPP_NEGATIVE" && a.enabled
          );

          if (rating <= 2 && whatsappAlert && business.user.plan === "GROWTH") {
            const config = whatsappAlert.config as { phone?: string } | null;
            if (config?.phone) {
              await sendNegativeReviewAlert({
                to: config.phone,
                authorName: gr.reviewer.displayName,
                rating,
                reviewText: gr.comment ?? "",
                dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
              }).catch(console.error);
            }
          }
        }

        totalNew++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Business ${business.id}: ${msg}`);
      console.error(`Sync failed for ${business.id}:`, err);
    }
  }

  return NextResponse.json({
    synced: businesses.length,
    newReviews: totalNew,
    ...(errors.length > 0 && { errors }),
  });
}
