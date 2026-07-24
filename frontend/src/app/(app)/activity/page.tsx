"use client";

import { TopBar } from "@/components/layout/TopBar";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default function ActivityPage() {
  return (
    <div>
      <TopBar
        title="Activity timeline"
        subtitle="Live feed of OrganizationRegistered, RelationshipCreated, ReviewVerified, DisputeOpened, TrustScoreUpdated, and more."
      />
      <div className="mx-auto max-w-3xl">
        <ActivityFeed limit={40} />
      </div>
    </div>
  );
}
