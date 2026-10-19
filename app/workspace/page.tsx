import type { Metadata } from "next";
import HomePanels from "@/components/HomePanels";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Workspace Sign In | SCALE AI",
  description: "Sign in to your customer chat account or staff team inbox.",
  robots: { index: false, follow: false }
};

export default function WorkspacePage() {
  return (
    <SiteChrome>
      <HomePanels />
    </SiteChrome>
  );
}
