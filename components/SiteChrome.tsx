import type { ReactNode } from "react";
import Link from "next/link";

export default function SiteChrome({ children }: { children: ReactNode }) {
  return <>
    <header className="topbar">
      <Link className="brand" href="/" aria-label="SCALE AI Website">
        <span>SCALE <span>AI</span><small>ENTERPRISE ENGINEERING</small></span>
      </Link>
      <div className="chrome-context"><span>Digital products &amp; business technology</span><small>SECTOR 73 · NOIDA</small></div>
      <Link className="site-link" href="/explore" id="explore-nav-button" aria-label="Explore our AI business website">
        Explore <span aria-hidden="true">→</span>
      </Link>
    </header>
    {children}
    <footer className="page-footer">
      <span>SCALE AI Technologies Pvt. Ltd. · Sector 73, Noida</span>
      <div className="page-footer-links">
        <Link href="/explore#contact">Contact the team</Link>
        <Link href="/workspace">Workspace access</Link>
        <Link href="/explore">Explore Website</Link>
      </div>
    </footer>
  </>;
}
