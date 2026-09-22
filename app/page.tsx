export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-mode";
import LandingPage from "@/components/landing/landing-page";

export const metadata = {
  title: "ReviewPilot — AI Review Management for Indian Businesses",
  description: "Reply to every Google & Play Store review automatically with AI. Increase ratings, recover bad reviews, and manage 20+ languages from one dashboard.",
};

export default async function RootPage() {
  // Only redirect authenticated users (skip in demo mode — no real auth)
  if (!isDemoMode()) {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) redirect("/dashboard");
  }

  return <LandingPage />;
}
