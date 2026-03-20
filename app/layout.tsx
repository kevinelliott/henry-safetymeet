import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafetyMeet — OSHA-Compliant Toolbox Talks",
  description:
    "Digital safety meetings with worker sign-off. Instant OSHA audit trail.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
