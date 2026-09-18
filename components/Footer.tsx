import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const columns: { title: string; links: string[] }[] = [
  {
    title: "Marketli",
    links: ["About", "Join Us", "Member Benefits", "Advertise With Us"],
  },
  {
    title: "Explore",
    links: ["Tools to Promote Ads"],
  },
  {
    title: "Info",
    links: [
      "Verification",
      "Terms of Use",
      "Privacy Policy",
      "Posting Policy",
      "Security",
      "Ad Choices",
    ],
  },
  {
    title: "Support",
    links: ["Community Connect", "Marketli en Français", "Accessibility"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white/80">
      <div className="shell grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/50">
              {col.title}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link}>
                  <Link href="#" className="hover:text-white">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-white/20 px-3 py-1.5 text-xs">
              Download on the App Store
            </span>
            <span className="rounded-md border border-white/20 px-3 py-1.5 text-xs">
              Get it on Google Play
            </span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <Facebook size={18} />
            <Instagram size={18} />
            <Twitter size={18} />
            <Youtube size={18} />
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-white/40">
          © 2005-2026 Marketli Group B.V. All rights reserved. This is a
          front-end clone built for demonstration purposes only.
        </p>
      </div>
    </footer>
  );
}
