export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { MOCK_REVIEWS, MOCK_STATS, MOCK_BUSINESS, MOCK_SENTIMENT } from "@/lib/mock-data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function getDashboardData() {
  return {
    stats: MOCK_STATS,
    reviews: MOCK_REVIEWS,
    business: MOCK_BUSINESS,
    sentiment: MOCK_SENTIMENT,
    lastSynced: new Date().toISOString(),
  };
}

export const metadata = { title: "Dashboard — ReviewPilot" };

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    }>
      <DashboardClient {...data} />
    </Suspense>
  );
}
