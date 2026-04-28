import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "prompt-snap — screenshot to HTML/CSS",
  description:
    "Drop a screenshot, get a working single-file HTML/CSS clone. Powered by Claude Vision.",
  openGraph: {
    title: "prompt-snap",
    description: "Drop a screenshot, get HTML/CSS.",
    type: "website",
    images: ["/cover.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "prompt-snap",
    description: "Drop a screenshot, get a working HTML clone.",
    images: ["/cover.png"],
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
