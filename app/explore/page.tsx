import type { Metadata } from "next";
import BusinessWebsite from "@/components/BusinessWebsite";

export const metadata: Metadata = {
  title: "Explore SCALE AI | Enterprise Business Systems & Software Engineering",
  description: "Explore SCALE AI business services, custom web and mobile engineering, n8n workflow automations, verified client stories, and grounded AI solutions.",
  openGraph: {
    title: "Explore SCALE AI | Enterprise Business Systems & Software Engineering",
    description: "Explore SCALE AI business services, custom web and mobile engineering, n8n workflow automations, verified client stories, and grounded AI solutions.",
    type: "website"
  }
};

export default function ExplorePage() {
  return <BusinessWebsite />;
}
