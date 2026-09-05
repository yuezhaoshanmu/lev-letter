import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AudioProvider from "../components/AudioProvider";
import VisitorTracker from "../components/VisitorTracker";
import { visitorClientScript } from "../lib/visitor";

export const metadata: Metadata = {
  title: "致饶饶的一封信",
  description: "",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="theme-color" content="#0b2428" />
      </head>
      <body>
        <AudioProvider><VisitorTracker />{children}</AudioProvider>
        <Script id="visitor-tracker" strategy="afterInteractive">
          {visitorClientScript()}
        </Script>
      </body>
    </html>
  );
}
