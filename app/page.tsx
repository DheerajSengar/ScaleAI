import type { Metadata } from "next";
import BusinessWebsite from "@/components/BusinessWebsite";

export const metadata: Metadata = {
  title: "SCALE AI | Intelligent Business Systems & Software Engineering",
  description: "Production-ready AI business solutions, bespoke web platforms, cross-platform mobile apps, and automated workflows grounded in enterprise intelligence.",
  openGraph: {
    title: "SCALE AI | Intelligent Business Systems & Software Engineering",
    description: "Production-ready AI business solutions, bespoke web platforms, cross-platform mobile apps, and automated workflows grounded in enterprise intelligence.",
    type: "website"
  }
};

export default function HomePage() {
  return <BusinessWebsite />;
}
