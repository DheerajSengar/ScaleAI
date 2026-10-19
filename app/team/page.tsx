import type { Metadata } from "next";
import TeamInbox from "@/components/TeamInbox";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Team Inbox | SCALE AI",
  description: "SCALE AI team live chat inbox.",
  robots: { index: false, follow: false }
};

export default function TeamPage() {
  return <SiteChrome><TeamInbox loginEnabled={false} /></SiteChrome>;
}
