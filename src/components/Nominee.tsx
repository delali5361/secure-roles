import { useState } from "react";
import { Btn, Field } from "@/components/ui-kit";
import type { ApplicationQuestion, Candidacy, NomineeProfile, User } from "@/lib/store";

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
          {!!p.awards?.length && (
            <div><p className="label-cap mb-1">Awards & honors</p><ul className="space-y-1">{p.awards.map((a, i) => <li key={i} className="flex gap-2 text-[13px]"><span className="text-mint">🏆</span>{a}</li>)}</ul></div>
          )}
          {!!p.gallery?.length && (
            <div><p className="label-cap mb-1">Gallery</p><div className="grid grid-cols-3 gap-2">{p.gallery.map((g, i) => <img key={i} src={g} alt="" className="aspect-square w-full rounded-lg object-cover" />)}</div></div>
          )}
          {!!p.focusAreas?.length && <div className="flex flex-wrap gap-1">{p.focusAreas.map((f) => <span key={f} className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[11px] text-cyan">{f}</span>)}</div>}
          {(p.occupation || p.education || p.experienceYears || p.nationality) && <p className="text-[12px] text-muted-foreground">{[p.occupation, p.education, p.experienceYears && `${p.experienceYears} yrs experience`, p.nationality].filter(Boolean).join(" · ")}</p>}
          {p.groupMembers && <div><p className="label-cap mb-1">Members</p><p className="whitespace-pre-line text-[13px]">{p.groupMembers}</p></div>}
          {p.impact && <div><p className="label-cap mb-1">Impact</p><p className="text-[13px]">{p.impact}</p></div>}
          {p.video && <video controls preload="metadata" src={p.video.data} className="aspect-video w-full rounded-lg" />}
          {p.supportingDoc && <a href={p.supportingDoc.data} download={p.supportingDoc.name} className="inline-block text-[12px] text-cyan">📎 {p.supportingDoc.name}</a>}
          {p.reason && <div><p className="label-cap mb-1">Why nominated</p><p className="text-[13px] text-muted-foreground">{p.reason}</p></div>}
          {p.nominatedBy && <p className="text-[12px] text-muted-foreground">Nominated by <span className="text-foreground">{p.nominatedBy}</span></p>}
          <div className="flex flex-wrap gap-2">
            {socials.map(([k, label, base]) => (
              <a key={k} href={base + (p.socials?.[k] ?? "").replace(/^@/, "")} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-card px-3 py-1 text-[12px] hover:border-cyan/40">{label} · @{(p.socials?.[k] ?? "").replace(/^@/, "")}</a>
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
export function NomineeForm({ manifesto, setManifesto, profile, setProfile, questions = [] }: { manifesto: string; setManifesto: (s: string) => void; profile: NomineeProfile; setProfile: (p: NomineeProfile) => void; questions?: ApplicationQuestion[] | undefined }) {
  const [ach, setAch] = useState("");
  const [awd, setAwd] = useState("");
  const set = <K extends keyof NomineeProfile>(k: K, v: NomineeProfile[K]) => setProfile({ ...profile, [k]: v });
  const onPhoto = (f?: File) => {
    if (!f) return;
    if (f.size > 1.5e6) return alert("Please pick an image under 1.5 MB.");
    const r = new FileReader();
    r.onload = () => set("photo", r.result as string);
    r.readAsDataURL(f);
  };
  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    const cur = profile.gallery ?? [];
    if (cur.length + files.length > 6) return alert("Up to 6 gallery photos.");
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size <= 1.5e6);
    if (valid.length !== files.length) alert("Only images under 1.5 MB can be added.");
    const photos = await Promise.all(valid.map((f) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error("Image could not be read")); r.readAsDataURL(f); })));
    setProfile({ ...profile, gallery: [...cur, ...photos] });
  };
  const onDoc = (f?: File) => {
    if (!f) return;
    if (f.size > 2e6) return alert("Please pick a file under 2 MB.");
    const r = new FileReader();
    r.onload = () => set("supportingDoc", { name: f.name, data: r.result as string });
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
      <Section title="Nominee details">
        <Field label="Nominee type"><select className="field" value={profile.nomineeType ?? "individual"} onChange={(e) => set("nomineeType", e.target.value as NomineeProfile["nomineeType"])}><option value="individual">Individual</option><option value="group">Group / band / team</option><option value="organization">Organization</option></select></Field>
        {profile.nomineeType && profile.nomineeType !== "individual" && <Field label="Members / representatives"><textarea rows={2} className="field" value={profile.groupMembers ?? ""} onChange={(e) => set("groupMembers", e.target.value)} placeholder="One name per line" /></Field>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact email *"><input type="email" className="field" value={profile.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
          <Field label="Contact phone *"><input className="field" value={profile.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+233…" /></Field>
          {(profile.nomineeType ?? "individual") === "individual" && <>
            <Field label="Date of birth"><input type="date" className="field" value={profile.dob ?? ""} onChange={(e) => set("dob", e.target.value)} /></Field>
            <Field label="Gender"><select className="field" value={profile.gender ?? ""} onChange={(e) => set("gender", e.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></Field>
          </>}
          <Field label="Nationality"><input className="field" value={profile.nationality ?? ""} onChange={(e) => set("nationality", e.target.value)} /></Field>
          <Field label="ID / student / registration no."><input className="field" value={profile.idNumber ?? ""} onChange={(e) => set("idNumber", e.target.value)} /></Field>
          <Field label="Education"><input className="field" value={profile.education ?? ""} onChange={(e) => set("education", e.target.value)} /></Field>
          <Field label="Occupation"><input className="field" value={profile.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} /></Field>
          <Field label="Years of experience"><input type="number" min={0} max={80} className="field" value={profile.experienceYears ?? ""} onChange={(e) => set("experienceYears", e.target.value)} /></Field>
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
      <Section title="Awards & honors">
        <div className="flex gap-2">
          <input className="field" value={awd} onChange={(e) => setAwd(e.target.value)} placeholder="e.g. Ghana Music Awards — Best New Act" onKeyDown={(e) => { if (e.key === "Enter" && awd.trim()) { e.preventDefault(); set("awards", [...(profile.awards ?? []), awd.trim()]); setAwd(""); } }} />
          <button className="shrink-0 rounded-lg border border-border bg-card px-3 text-[12px] hover:bg-accent" onClick={() => { if (awd.trim()) { set("awards", [...(profile.awards ?? []), awd.trim()]); setAwd(""); } }}>Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.awards?.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[12px] text-mint">🏆 {a}<button onClick={() => set("awards", profile.awards!.filter((_, j) => j !== i))} aria-label="Remove">✕</button></span>
          ))}
        </div>
      </Section>
      <Section title="Photo gallery">
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-accent">
            Add photos<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGallery(e.target.files)} />
          </label>
          <p className="text-[11px] text-muted-foreground">Up to 6 photos · 1.5 MB each</p>
        </div>
        {!!profile.gallery?.length && (
          <div className="grid grid-cols-3 gap-2">
            {profile.gallery.map((g, i) => (
              <div key={i} className="group relative">
                <img src={g} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button onClick={() => set("gallery", profile.gallery!.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/80 text-[11px] text-destructive opacity-0 transition group-hover:opacity-100" aria-label="Remove photo">✕</button>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Impact">
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => { const on = profile.focusAreas?.includes(f); return <button key={f} type="button" onClick={() => set("focusAreas", on ? profile.focusAreas!.filter((x) => x !== f) : [...(profile.focusAreas ?? []), f])} className={`rounded-full border px-3 py-1 text-[12px] ${on ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-border bg-card text-muted-foreground"}`}>{f}</button>; })}
        </div>
        <Field label="Impact in the last 12 months"><textarea rows={3} maxLength={600} className="field" value={profile.impact ?? ""} onChange={(e) => set("impact", e.target.value)} placeholder="Numbers, results, people reached…" /></Field>
        <Field label="References"><textarea rows={2} className="field" value={profile.references ?? ""} onChange={(e) => set("references", e.target.value)} placeholder="Name · relationship · contact" /></Field>
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-accent">Upload supporting document<input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onDoc(e.target.files?.[0])} /></label>
          {profile.supportingDoc && <span className="text-[12px]">📎 {profile.supportingDoc.name} <button className="ml-1 text-destructive" onClick={() => set("supportingDoc", undefined)}>✕</button></span>}
        </div>
      </Section>
      <Section title="Media & socials">
        <Field label="Upload pitch video"><input type="file" accept="video/mp4,video/webm" className="field" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (!["video/mp4", "video/webm"].includes(file.type) || file.size > 1.5e6) { alert("Choose an MP4 or WebM video under 1.5 MB, or use a video link instead."); return; } const reader = new FileReader(); reader.onload = () => set("video", { name: file.name, data: String(reader.result) }); reader.readAsDataURL(file); }} /></Field>
        {profile.video && <div className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{profile.video.name}</span><Btn size="sm" variant="danger" onClick={() => set("video", undefined)}>Remove video</Btn></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pitch video link"><input className="field" value={profile.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/…" /></Field>
          <Field label="Website / portfolio"><input className="field" value={profile.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          {SOCIALS.map(([k, label]) => (
            <Field key={k} label={label}><input className="field" value={profile.socials?.[k] ?? ""} onChange={(e) => set("socials", { ...profile.socials, [k]: e.target.value })} placeholder="@handle" /></Field>
          ))}
        </div>
      </Section>
      {!!questions.length && <Section title="Election questions">{questions.map((q) => <Field key={q.id} label={`${q.label}${q.required ? " *" : ""}`}><textarea className="field" rows={3} value={profile.answers?.[q.id] ?? ""} onChange={(e) => set("answers", { ...profile.answers, [q.id]: e.target.value })} /></Field>)}</Section>}
      <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-[13px]">
        <input type="checkbox" className="mt-0.5" checked={!!profile.declaration} onChange={(e) => set("declaration", e.target.checked)} />
        <span>I confirm the information above is true and I accept the rules of this election. *</span>
      </label>
    </div>
  );
}

const FOCUS = ["Leadership", "Innovation", "Community", "Arts & culture", "Sports", "Education", "Business", "Technology", "Health", "Environment"];

/** Returns a list of problems; empty means valid. */
export function validateNominee(manifesto: string, p: NomineeProfile, questions: ApplicationQuestion[] = []): string[] {
  const e: string[] = [];
  const url = (s?: string) => !s || /^https?:\/\/[^\s.]+\.[^\s]+$/.test(s);
  if (manifesto.trim().length < 30) e.push("Manifesto / pitch must be at least 30 characters.");
  if (!p.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)) e.push("Enter a valid contact email.");
  if (!p.contactPhone || !/^\+?[0-9 ()-]{7,20}$/.test(p.contactPhone)) e.push("Enter a valid contact phone number.");
  if (p.dob) { const age = (Date.now() - new Date(p.dob).getTime()) / 31557600000; if (!Number.isFinite(age) || age < 13 || age > 120) e.push("Date of birth looks wrong (must be 13+)."); }
  if (p.experienceYears && (isNaN(+p.experienceYears) || +p.experienceYears < 0)) e.push("Years of experience must be a positive number.");
  if (p.nomineeType && p.nomineeType !== "individual" && !p.groupMembers?.trim()) e.push("List the group's members or representatives.");
  if (!p.bio || p.bio.trim().length < 20) e.push("Write a short bio (20+ characters).");
  if (!url(p.website)) e.push("Website must start with http:// or https://");
  if (!url(p.videoUrl)) e.push("Pitch video link must start with http:// or https://");
  if (!p.declaration) e.push("Tick the declaration at the bottom of the form.");
  questions.forEach((q) => { if (q.required && !p.answers?.[q.id]?.trim()) e.push(`Answer: ${q.label}`); });
  return e;
}

/** Visual tracker of an application's progress. */
export function StatusTracker({ c }: { c: Candidacy }) {
  const steps = ["Submitted", "Under review", c.status === "rejected" ? "Rejected" : "Approved"];
  const at = c.status === "pending" ? 1 : 2;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i < at || (i === at && c.status !== "pending") ? (c.status === "rejected" && i === 2 ? "bg-destructive text-destructive-foreground" : "bg-mint text-background") : i === at ? "border-2 border-amber text-amber" : "border border-border text-muted-foreground"}`}>{i + 1}</div>
            <span className="text-[12px]">{s}</span>
            {i < 2 && <div className={`h-px flex-1 ${i < at ? "bg-mint" : "bg-border"}`} />}
          </div>
        ))}
      </div>
      {!!c.history?.length && (
        <ul className="space-y-1 border-l border-border pl-3">
          {[...c.history].reverse().map((h, i) => <li key={i} className="text-[12px]"><span className="text-muted-foreground">{new Date(h.at).toLocaleString()}</span> · {h.label}</li>)}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3 rounded-xl border border-border bg-card p-4"><p className="font-display text-[14px] font-semibold">{title}</p>{children}</div>;
}
