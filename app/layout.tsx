import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Marketli — Buy, sell and find anything near you",
  description:
    "A local classifieds marketplace clone built with Next.js and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans text-[15px]">
        <Header />
        <main className="flex-1 bg-surface">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
