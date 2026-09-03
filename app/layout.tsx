import type { Metadata } from "next";
import "./globals.css";
import AudioProvider from "../components/AudioProvider";

export const metadata: Metadata = {
  title: "给饶饶的一封信",
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
      <body><AudioProvider>{children}</AudioProvider></body>
    </html>
  );
}
