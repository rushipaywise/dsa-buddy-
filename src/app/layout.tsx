import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";
import "streamdown/styles.css";

export const metadata: Metadata = {
  title: "DSA Buddy",
  description: "AI pair coder for DSA practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
