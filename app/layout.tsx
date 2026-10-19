import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SCALE AI | Intelligent Business Systems & Software Engineering",
  description: "Explore SCALE AI business services, custom web & mobile apps, n8n automations, and enterprise AI solutions.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "SCALE AI | Intelligent Business Systems & Software Engineering",
    description: "Explore SCALE AI business services, custom web & mobile apps, n8n automations, and enterprise AI solutions.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="/styles.css?v=3" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
