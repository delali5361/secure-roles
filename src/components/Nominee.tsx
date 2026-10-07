import { useState } from "react";
import { Field } from "@/components/ui-kit";
import type { Candidacy, NomineeProfile, User } from "@/lib/store";

const SOCIALS = [
  ["instagram", "Instagram", "https://instagram.com/"],
  ["x", "X / Twitter", "https://x.com/"],
  ["tiktok", "TikTok", "https://tiktok.com/@"],
  ["youtube", "YouTube", "https://youtube.com/@"],
  ["facebook", "Facebook", "https://facebook.com/"],
  ["linkedin", "LinkedIn", "https://linkedin.com/in/"],
] as const;

export function Avatar({ c, u, size = 48 }: { c?: Candidacy | undefined; u?: User | undefined; size?: number }) {
  const name = c?.profile?.stageName || u?.name || "?";
  const initials = name.replace(/['"]/g, "").split(" ").map((x) => x[0]).join("").slice(0, 2);
  return c?.profile?.photo ? (
    <img src={c.profile.photo} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-xl object-cover" />
  ) : (
    <div style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-xl bg-brand-diag font-display font-bold text-primary-foreground">{initials}</div>
  );
}

export const displayName = (c: Candidacy, u?: User) => c.profile?.stageName || u?.name || "Unknown";

/** Rich profile view used on ballots, review, and the nominee's own page. */
export function NomineeDetails({ c, u, compact = false }: { c: Candidacy; u?: User | undefined; compact?: boolean }) {
  const p = c.profile ?? {};
  const socials = SOCIALS.filter(([k]) => p.socials?.[k]);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar c={c} u={u} size={compact ? 44 : 64} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-semibold">{displayName(c, u)}</p>
            {c.code && <span className="rounded-md border border-cyan/30 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan">{c.code}</span>}
          </div>
          {p.stageName && u && <p className="text-[12px] text-muted-foreground">{u.name}</p>}
          {p.tagline && <p className="text-[13px] italic text-mint">"{p.tagline}"</p>}
          {(p.organization || p.location) && <p className="text-[12px] text-muted-foreground">{[p.organization, p.location].filter(Boolean).join(" · ")}</p>}
        </div>
      </div>
      {!compact && (
        <>
          {p.bio && <p className="text-[13px] text-muted-foreground">{p.bio}</p>}
          <div><p className="label-cap mb-1">Manifesto / pitch</p><p className="text-[13px]">{c.manifesto}</p></div>
          {!!p.achievements?.length && (
            <div><p className="label-cap mb-1">Achievements</p><ul className="space-y-1">{p.achievements.map((a, i) => <li key={i} className="flex gap-2 text-[13px]"><span className="text-amber">★</span>{a}</li>)}</ul></div>
          )}
          {p.reason && <div><p className="label-cap mb-1">Why nominated</p><p className="text-[13px] text-muted-foreground">{p.reason}</p></div>}
          {p.nominatedBy && <p className="text-[12px] text-muted-foreground">Nominated by <span className="text-foreground">{p.nominatedBy}</span></p>}
          <div className="flex flex-wrap gap-2">
            {socials.map(([k, label, base]) => (
              <a key={k} href={base + p.socials![k]!.replace(/^@/, "")} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-card px-3 py-1 text-[12px] hover:border-cyan/40">{label} · @{p.socials![k]!.replace(/^@/, "")}</a>
            ))}
            {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-card px-3 py-1 text-[12px] hover:border-cyan/40">Website ↗</a>}
            {p.videoUrl && <a href={p.videoUrl} target="_blank" rel="noreferrer" className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-[12px] text-cyan">▶ Watch pitch video</a>}
          </div>
        </>
      )}
    </div>
  );
}

/** Editable nominee profile form. */
export function NomineeForm({ manifesto, setManifesto, profile, setProfile }: { manifesto: string; setManifesto: (s: string) => void; profile: NomineeProfile; setProfile: (p: NomineeProfile) => void }) {
  const [ach, setAch] = useState("");
  const set = <K extends keyof NomineeProfile>(k: K, v: NomineeProfile[K]) => setProfile({ ...profile, [k]: v });
  const onPhoto = (f?: File) => {
    if (!f) return;
    if (f.size > 1.5e6) return alert("Please pick an image under 1.5 MB.");
    const r = new FileReader();
    r.onload = () => set("photo", r.result as string);
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-5">
      <Section title="Identity">
        <div className="flex items-center gap-4">
          {profile.photo ? <img src={profile.photo} alt="" className="size-20 rounded-xl object-cover" /> : <div className="grid size-20 place-items-center rounded-xl border border-dashed border-border text-[11px] text-muted-foreground">No photo</div>}
          <div className="space-y-2">
            <label className="inline-flex cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-accent">
              Upload photo<input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            {profile.photo && <button className="ml-2 text-[12px] text-destructive" onClick={() => set("photo", undefined)}>Remove</button>}
            <p className="text-[11px] text-muted-foreground">Square headshot works best · max 1.5 MB</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Display / stage name"><input className="field" value={profile.stageName ?? ""} onChange={(e) => set("stageName", e.target.value)} placeholder="Optional" /></Field>
          <Field label="Tagline"><input className="field" maxLength={60} value={profile.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Short catchy slogan" /></Field>
          <Field label="Organization / department"><input className="field" value={profile.organization ?? ""} onChange={(e) => set("organization", e.target.value)} /></Field>
          <Field label="Location"><input className="field" value={profile.location ?? ""} onChange={(e) => set("location", e.target.value)} /></Field>
        </div>
      </Section>
      <Section title="Story">
        <Field label="Short bio"><textarea rows={3} maxLength={400} className="field" value={profile.bio ?? ""} onChange={(e) => set("bio", e.target.value)} placeholder="Who are you, in a few lines?" /></Field>
        <Field label="Manifesto / pitch *"><textarea rows={4} className="field" value={manifesto} onChange={(e) => setManifesto(e.target.value)} placeholder="Why should people vote for you?" /></Field>
        <Field label="Why you deserve this nomination"><textarea rows={2} className="field" value={profile.reason ?? ""} onChange={(e) => set("reason", e.target.value)} /></Field>
        <Field label="Nominated by"><input className="field" value={profile.nominatedBy ?? ""} onChange={(e) => set("nominatedBy", e.target.value)} placeholder="Self, a club, a company…" /></Field>
      </Section>
      <Section title="Achievements">
        <div className="flex gap-2">
          <input className="field" value={ach} onChange={(e) => setAch(e.target.value)} placeholder="e.g. Best Newcomer 2025" onKeyDown={(e) => { if (e.key === "Enter" && ach.trim()) { e.preventDefault(); set("achievements", [...(profile.achievements ?? []), ach.trim()]); setAch(""); } }} />
          <button className="shrink-0 rounded-lg border border-border bg-card px-3 text-[12px] hover:bg-accent" onClick={() => { if (ach.trim()) { set("achievements", [...(profile.achievements ?? []), ach.trim()]); setAch(""); } }}>Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.achievements?.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-[12px] text-amber">★ {a}<button onClick={() => set("achievements", profile.achievements!.filter((_, j) => j !== i))} aria-label="Remove">✕</button></span>
          ))}
        </div>
      </Section>
      <Section title="Media & socials">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pitch video link"><input className="field" value={profile.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/…" /></Field>
          <Field label="Website / portfolio"><input className="field" value={profile.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          {SOCIALS.map(([k, label]) => (
            <Field key={k} label={label}><input className="field" value={profile.socials?.[k] ?? ""} onChange={(e) => set("socials", { ...profile.socials, [k]: e.target.value })} placeholder="@handle" /></Field>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3 rounded-xl border border-border bg-card p-4"><p className="font-display text-[14px] font-semibold">{title}</p>{children}</div>;
}
