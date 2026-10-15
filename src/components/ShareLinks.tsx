import { useState } from "react";
import { Btn } from "@/components/ui-kit";

/** Build the public share URL for a nominee. */
export const nomineeUrl = (candidacyId: string) => `${location.origin}/vote/${candidacyId}`;

/** Copy-link + social share buttons (WhatsApp, X, Facebook, Telegram) for a nominee page. */
export function ShareLinks({ url, text, size = "sm" }: { url: string; text: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy this link:", url); }
  };
  const native = async () => {
    try { await navigator.share({ title: text, text, url }); } catch { /* user cancelled */ }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Btn size={size} variant="soft" onClick={copy}>{copied ? "✓ Link copied" : "Copy link"}</Btn>
      {"share" in navigator && <Btn size={size} variant="ghost" onClick={native}>Share…</Btn>}
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-accent">
          {l.label}
        </a>
      ))}
    </div>
  );
}
