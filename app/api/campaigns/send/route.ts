import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendReviewRequestWhatsApp } from "@/lib/twilio";
import { resend } from "@/lib/resend";
import { isDemoMode } from "@/lib/demo-mode";
import { rateLimit } from "@/lib/rate-limit";
import type { CampaignType } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sanitize(str: string): string {
  return str.trim().replace(/[<>"']/g, "");
}

function isValidPhone(v: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(v.trim());
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ─── POST /api/campaigns/send ────────────────────────────────────────────────
export async function POST(request: NextRequest) {

  // ── Rate limit: 20 requests per minute per IP ──
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok, remaining } = rateLimit(ip, 20, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  // ── Parse body ──
  let body: { recipient?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const recipient = sanitize(body.recipient ?? "");
  const type = (body.type ?? "EMAIL").toUpperCase() as CampaignType;

  // ── Input validation ──
  if (!recipient) {
    return NextResponse.json({ error: "recipient is required." }, { status: 400 });
  }
  if (!["WHATSAPP", "EMAIL"].includes(type)) {
    return NextResponse.json({ error: "type must be WHATSAPP or EMAIL." }, { status: 400 });
  }
  if (type === "WHATSAPP" && !isValidPhone(recipient)) {
    return NextResponse.json(
      { error: "Invalid phone number. Use format: +919876543210 or 9876543210" },
      { status: 400 }
    );
  }
  if (type === "EMAIL" && !isValidEmail(recipient)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // ── Demo / no-DB mode ──
  // Only bypass real sending if BOTH Supabase AND Twilio/Resend are unconfigured.
  const hasTwilio  = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasResend  = !!process.env.RESEND_API_KEY;
  const hasSupabase = !isDemoMode();

  if (!hasSupabase && (type === "WHATSAPP" ? !hasTwilio : !hasResend)) {
    await new Promise(r => setTimeout(r, 700));
    return NextResponse.json({
      success: true,
      campaignId: `demo_${Date.now()}`,
      message: `Demo mode: Review request would be sent to ${recipient} via ${type}.`,
    });
  }

  // ── Auth check ──
  if (!hasSupabase) {
    // Supabase not configured but messaging IS configured — send without DB record
    const reviewLink = "https://g.page/review";
    if (type === "WHATSAPP") {
      await sendReviewRequestWhatsApp({
        to: recipient,
        businessName: "Your Business",
        reviewLink,
        campaignId: `anon_${Date.now()}`,
      });
    }
    return NextResponse.json({ success: true, campaignId: `anon_${Date.now()}` });
  }

  const supabase = createRouteHandlerClient({ cookies });
  let session;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch {
    return NextResponse.json({ error: "Auth service unavailable." }, { status: 503 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
  }

  // ── Business lookup ──
  const business = await prisma.business.findFirst({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!business) {
    return NextResponse.json({ error: "No business found for your account." }, { status: 404 });
  }

  // ── Plan checks ──
  if (type === "WHATSAPP" && business.user.plan !== "GROWTH") {
    return NextResponse.json(
      { error: "WhatsApp campaigns require the Growth plan. Please upgrade." },
      { status: 403 }
    );
  }
  if (type === "EMAIL" && business.user.plan === "FREE") {
    return NextResponse.json(
      { error: "Email campaigns require the Starter plan or above. Please upgrade." },
      { status: 403 }
    );
  }

  const reviewLink = business.googleLocationId
    ? `https://search.google.com/local/writereview?placeid=${business.googleLocationId}`
    : "https://g.page/review";

  // ── Create campaign record ──
  const campaign = await prisma.campaign.create({
    data: { businessId: business.id, type, recipient, reviewLink, sentAt: new Date() },
  });

  // ── Send ──
  try {
    if (type === "WHATSAPP") {
      await sendReviewRequestWhatsApp({
        to: recipient,
        businessName: business.name,
        reviewLink,
        campaignId: campaign.id,
      });
    } else {
      await resend.emails.send({
        from: "ReviewPilot <noreply@reviewpilot.in>",
        to: recipient,
        subject: `How was your experience at ${business.name}?`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0c0f1a;color:#e4e8f7;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7B5CFF,#9B6FFF);border-radius:12px;padding:12px 20px;">
                <span style="color:#fff;font-size:18px;font-weight:800;">ReviewPilot</span>
              </div>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#ffffff;">How was your experience?</h2>
            <p style="color:#a0aabf;line-height:1.6;margin:0 0 24px;">Thank you for visiting <strong style="color:#e4e8f7;">${business.name}</strong>! Your feedback means the world to us.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${reviewLink}" style="display:inline-block;background:linear-gradient(135deg,#7B5CFF,#6366F1);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">⭐ Leave a Google Review</a>
            </div>
            <p style="color:#5d6590;font-size:13px;text-align:center;margin-top:24px;">Thank you for your support 🙏 — Team ${business.name}</p>
          </div>
        `,
      });
    }
  } catch (sendErr: unknown) {
    const errMsg = sendErr instanceof Error ? sendErr.message : "Send failed";
    // Mark campaign as failed (best effort)
    await prisma.campaign.update({ where: { id: campaign.id }, data: { sentAt: null } }).catch(() => {});
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  return NextResponse.json({ success: true, campaignId: campaign.id });
}
