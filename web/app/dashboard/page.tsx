import type { Metadata } from "next";
import { DashboardDemo } from "@/components/DashboardDemo";

export const metadata: Metadata = {
  title: "Dashboard demo",
  description:
    "Explore the KeyOps dashboard: key age, spend, last use, rotation runs, consumers, and rollback status. Demo data only.",
};

export default function DashboardPage() {
  return <DashboardDemo />;
}
