import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobLens — Decode any job posting and prep for it",
  description:
    "Paste a job description and your background to get a tailored fit summary, resume keywords, skill gaps, and likely interview questions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
