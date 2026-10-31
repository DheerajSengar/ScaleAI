import type { Metadata } from "next";
import HomePanels from "@/components/HomePanels";
import SaaSDashboard from "@/components/SaaSDashboard";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Workspace & Business Hub | AI Business Chatbot",
  description: "Sign in to customer chat, staff inbox, and manage AI subscriptions & knowledge bases.",
  robots: { index: false, follow: false }
};

export default function WorkspacePage() {
  return (
    <SiteChrome>
      <div style={{ padding: "1rem" }}>
        {/* Modern SaaS Hub: Subscriptions, Neural Uploads & ML Intelligence */}
        <SaaSDashboard />
        
        {/* Workspace Auth & Inbox Panels */}
        <div style={{ marginTop: "2rem" }}>
          <HomePanels />
        </div>
      </div>
    </SiteChrome>
  );
}
