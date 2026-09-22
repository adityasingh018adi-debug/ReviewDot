import twilio from "twilio";

// ─── Credential guard ────────────────────────────────────────────────────────
function getClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment variables."
    );
  }
  return twilio(sid, token);
}

// WhatsApp sender number — must be whatsapp:+<number>
function getFromNumber(): string {
  const raw = process.env.TWILIO_WHATSAPP_FROM || "+14155238886";
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

// ─── Phone number normalisation ──────────────────────────────────────────────
// Accepts: +919876543210 | 09876543210 | 9876543210 | +1 234 567 8900
// Returns: whatsapp:+<E.164>
function toWhatsAppNumber(raw: string): string {
  // Strip everything except digits and leading +
  let cleaned = raw.trim().replace(/[\s\-().]/g, "");

  // Already has country code
  if (cleaned.startsWith("+")) {
    return `whatsapp:${cleaned}`;
  }

  // Indian mobile: 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `whatsapp:+91${cleaned}`;
  }

  // Indian with leading 0
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `whatsapp:+91${cleaned.slice(1)}`;
  }

  // Fallback — just prepend +
  return `whatsapp:+${cleaned}`;
}

// ─── Send negative-review WhatsApp alert to business owner ───────────────────
export async function sendNegativeReviewAlert({
  to,
  authorName,
  rating,
  reviewText,
  dashboardUrl,
}: {
  to: string;
  authorName: string;
  rating: number;
  reviewText: string;
  dashboardUrl: string;
}): Promise<void> {
  const client = getClient();
  const stars  = "⭐".repeat(Math.max(1, Math.min(5, rating)));
  const snippet = reviewText
    ? `"${reviewText.slice(0, 120)}${reviewText.length > 120 ? "…" : ""}"`
    : "(No written comment)";

  const body = [
    `⚠️ *New ${rating}★ review* on *ReviewPilot*`,
    ``,
    `👤 Reviewer: *${authorName}*`,
    `${stars}`,
    `${snippet}`,
    ``,
    `👉 Reply now: ${dashboardUrl}`,
  ].join("\n");

  try {
    await client.messages.create({
      from: getFromNumber(),
      to: toWhatsAppNumber(to),
      body,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Twilio error codes: https://www.twilio.com/docs/api/errors
    if (msg.includes("21211")) throw new Error("Invalid phone number format.");
    if (msg.includes("21408")) throw new Error("Permission to send to this region is not enabled in your Twilio account.");
    if (msg.includes("63016")) throw new Error("WhatsApp message failed: the recipient has not opted in to the Twilio Sandbox. Ask them to send 'join <keyword>' to your Twilio WhatsApp number first.");
    if (msg.includes("63007")) throw new Error("Twilio WhatsApp channel is not set up. Ensure your FROM number is WhatsApp-enabled in the Twilio console.");
    throw new Error(`WhatsApp send failed: ${msg}`);
  }
}

// ─── Send review request to a customer via WhatsApp ─────────────────────────
export async function sendReviewRequestWhatsApp({
  to,
  businessName,
  reviewLink,
  campaignId,
}: {
  to: string;
  businessName: string;
  reviewLink: string;
  campaignId: string;
}): Promise<void> {
  const client = getClient();

  // Build tracking URL only if base URL is configured
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const trackingUrl = base
    ? `${base}/api/campaigns/track?id=${campaignId}&action=click`
    : reviewLink;

  const body = [
    `Hi! 👋 Thanks for visiting *${businessName}*`,
    ``,
    `We'd love to hear your feedback! If you enjoyed your experience, please take 30 seconds to leave us a quick Google review — it truly helps small businesses like ours:`,
    ``,
    `⭐ ${reviewLink}`,
    ``,
    `Thank you so much! 🙏`,
  ].join("\n");

  try {
    await client.messages.create({
      from: getFromNumber(),
      to: toWhatsAppNumber(to),
      body,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("21211")) throw new Error("Invalid phone number. Use format: +919876543210");
    if (msg.includes("63016")) throw new Error("Recipient has not opted in to WhatsApp sandbox. They must send 'join <keyword>' to your Twilio number first.");
    if (msg.includes("63007")) throw new Error("Your Twilio FROM number is not WhatsApp-enabled. Enable it in the Twilio Console → Messaging → Senders.");
    if (msg.includes("TWILIO_ACCOUNT_SID") || msg.includes("TWILIO_AUTH_TOKEN")) throw new Error("Twilio credentials missing. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env.local file.");
    throw new Error(`WhatsApp send failed: ${msg}`);
  }
}
