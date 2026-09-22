import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTransition } from "@/components/layout/page-transition";
import { MobileBottomNav } from "@/components/pwa/mobile-bottom-nav";
import { isDemoMode } from "@/lib/demo-mode";
import type { User, Business } from "@/types";

const DEMO_USER: User = {
  id: "demo",
  email: "demo@reviewpilot.in",
  name: "Demo User",
  avatarUrl: null,
  plan: "FREE",
  aiRepliesUsed: 3,
  onboardingCompleted: true,
};

const DEMO_BUSINESS: Business = {
  id: "biz_demo",
  name: "Sharma's Kitchen",
  category: "Restaurant",
  location: "Connaught Place, New Delhi",
  googleLocationId: null,
};

async function getLayoutData(): Promise<{ user: User; business: Business | null } | null> {
  if (isDemoMode()) {
    return { user: DEMO_USER, business: DEMO_BUSINESS };
  }

  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const user: User = {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.user_metadata?.full_name ?? null,
    avatarUrl: session.user.user_metadata?.avatar_url ?? null,
    plan: "FREE",
    aiRepliesUsed: 3,
    onboardingCompleted: true,
  };

  return { user, business: DEMO_BUSINESS };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getLayoutData();

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar user={data.user} business={data.business} />
      </div>
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0 dashboard-main">
        <PageTransition>{children}</PageTransition>
      </main>
      {/* Bottom nav — only on mobile */}
      <MobileBottomNav />
    </div>
  );
}
