import { useSyncExternalStore } from "react";

export type Role = "admin" | "voter" | "candidate";
export type User = { id: string; name: string; email: string; phone: string; password: string; role: Role; createdAt: string };
export type Position = { id: string; title: string; maxSelections: number };
export type ElectionStatus = "draft" | "open" | "closed" | "published";
export type Election = {
  id: string; title: string; organization: string; description: string;
  status: ElectionStatus; positions: Position[]; startsAt: string; endsAt: string;
  channels: { web: boolean; ussd: boolean }; createdAt: string;
};
export type CandidacyStatus = "pending" | "approved" | "rejected";
export type NomineeProfile = {
  photo?: string; gallery?: string[]; awards?: string[]; stageName?: string; tagline?: string; bio?: string; organization?: string; location?: string;
  achievements?: string[]; reason?: string; nominatedBy?: string; videoUrl?: string; website?: string;
  nomineeType?: "individual" | "group" | "organization"; groupMembers?: string; dob?: string; gender?: string; nationality?: string;
  idNumber?: string; contactEmail?: string; contactPhone?: string; education?: string; occupation?: string; experienceYears?: string;
  focusAreas?: string[]; impact?: string; references?: string; supportingDoc?: { name: string; data: string }; declaration?: boolean;
  socials?: { instagram?: string; x?: string; tiktok?: string; youtube?: string; facebook?: string; linkedin?: string };
};
export type Candidacy = { id: string; electionId: string; positionId: string; userId: string; manifesto: string; status: CandidacyStatus; createdAt: string; note?: string | undefined; code?: string; profile?: NomineeProfile; history?: { at: string; label: string }[] };
export type Vote = { id: string; electionId: string; voterId: string; selections: Record<string, string[]>; receipt: string; channel: "web" | "ussd"; castAt: string };
export type AuditEntry = { id: string; at: string; actor: string; action: string };

export type DB = { users: User[]; elections: Election[]; candidacies: Candidacy[]; votes: Vote[]; audit: AuditEntry[]; session: string | null };

const KEY = "ballotglass.db.v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const days = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 16);

function seed(): DB {
  const u = (name: string, email: string, role: Role, password: string, phone: string): User => ({ id: uid(), name, email, role, password, phone, createdAt: now() });
  const admin = u("Ama Mensah", "admin@vote.io", "admin", "admin123", "+233200000001");
  const voter = u("Kofi Boateng", "voter@vote.io", "voter", "voter123", "+233200000002");
  const voter2 = u("Esi Owusu", "esi@vote.io", "voter", "voter123", "+233200000003");
  const c1 = u("Lerato Dube", "cand@vote.io", "candidate", "cand123", "+233200000004");
  const c2 = u("Sipho Nkosi", "sipho@vote.io", "candidate", "cand123", "+233200000005");
  const c3 = u("Priya Nair", "priya@vote.io", "candidate", "cand123", "+233200000006");
  const p1 = { id: uid(), title: "President", maxSelections: 1 };
  const p2 = { id: uid(), title: "Treasurer", maxSelections: 1 };
  const e1: Election = { id: uid(), title: "Student Council 2026", organization: "University of Accra", description: "Annual election of the student council executive.", status: "open", positions: [p1, p2], startsAt: days(-1), endsAt: days(3), channels: { web: true, ussd: true }, createdAt: now() };
  const p3 = { id: uid(), title: "Board Member", maxSelections: 2 };
  const e2: Election = { id: uid(), title: "Cooperative Board", organization: "Kwela Farmers Co-op", description: "Elect two members to the cooperative board.", status: "draft", positions: [p3], startsAt: days(5), endsAt: days(8), channels: { web: true, ussd: true }, createdAt: now() };
  const cand = (e: Election, p: Position, user: User, m: string, status: CandidacyStatus = "approved"): Candidacy => ({ id: uid(), electionId: e.id, positionId: p.id, userId: user.id, manifesto: m, status, createdAt: now() });
  const k1 = { ...cand(e1, p1, c1, "Transparent budgets and open forums every month."), code: "N001", profile: { stageName: "Lerato 'The Voice' Dube", tagline: "Your voice, your council", bio: "Final-year law student and debate captain who has led three campus-wide reform campaigns.", organization: "Faculty of Law", location: "Accra", achievements: ["Debate Society captain 2024–2026", "Founded the Open Budget Forum", "Dean's List x3"], reason: "Consistently champions student transparency.", nominatedBy: "Law Students Association", socials: { instagram: "lerato.dube", x: "leratodube" } } };
  const k2 = { ...cand(e1, p1, c2, "Late-night transit and better mental-health services."), code: "N002", profile: { tagline: "Safe campus, healthy minds", bio: "Engineering student and peer counsellor.", organization: "School of Engineering", achievements: ["Peer counsellor of the year"], socials: { tiktok: "siphonkosi" } } };
  const k3 = { ...cand(e1, p2, c3, "Fee freeze and digital library access for all."), code: "N003", profile: { tagline: "Every cedi accounted for", bio: "Accounting major who audited three student clubs pro bono.", organization: "Business School", achievements: ["Treasurer, Finance Club"] } };
  const k4 = cand(e2, p3, c1, "Fair prices for every farmer.", "pending");
  const v: Vote = { id: uid(), electionId: e1.id, voterId: voter2.id, selections: { [p1.id]: [k2.id], [p2.id]: [k3.id] }, receipt: "RCPT-" + uid().toUpperCase(), channel: "ussd", castAt: now() };
  return { users: [admin, voter, voter2, c1, c2, c3], elections: [e1, e2], candidacies: [k1, k2, k3, k4], votes: [v], audit: [{ id: uid(), at: now(), actor: "system", action: "Platform initialized with demo data" }], session: null };
}

let db: DB | null = null;

/** Voting closes automatically once the end time passes. */
function autoClose(d: DB): boolean {
  let changed = false;
  for (const e of d.elections) {
    if (e.status === "open" && new Date(e.endsAt).getTime() <= Date.now()) {
      e.status = "closed"; changed = true;
      d.audit.unshift({ id: uid(), at: now(), actor: "system", action: `Voting closed automatically for "${e.title}"` });
    }
  }
  return changed;
}
if (typeof window !== "undefined") {
  setInterval(() => {
    if (!db) return;
    const d = structuredClone(db);
    if (autoClose(d)) { db = d; localStorage.setItem(KEY, JSON.stringify(d)); listeners.forEach((l) => l()); }
  }, 15000);
}
const listeners = new Set<() => void>();

function load(): DB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? (JSON.parse(raw) as DB) : seed();
  } catch {
    db = seed();
  }
  autoClose(db);
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

function commit(fn: (d: DB) => void, audit?: string) {
  const d = structuredClone(load());
  fn(d);
  if (audit) {
    const actor = d.users.find((x) => x.id === d.session)?.name ?? "anonymous";
    d.audit.unshift({ id: uid(), at: now(), actor, action: audit });
    d.audit = d.audit.slice(0, 200);
  }
  db = d;
  localStorage.setItem(KEY, JSON.stringify(d));
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

/** Returns null during SSR / first paint, then the DB. */
export function useDB(): DB | null {
  return useSyncExternalStore(subscribe, () => load(), () => null);
}

export function currentUser(d: DB | null) {
  return d?.users.find((u) => u.id === d.session) ?? null;
}

export const actions = {
  login(email: string, password: string): User {
    const d = load();
    const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error("Invalid email or password");
    commit((x) => { x.session = u.id; }, `${u.name} signed in`);
    return u;
  },
  register(input: { name: string; email: string; phone: string; password: string; role: Exclude<Role, "admin"> }): User {
    const d = load();
    if (d.users.some((x) => x.email.toLowerCase() === input.email.trim().toLowerCase())) throw new Error("An account with this email already exists");
    if (input.password.length < 6) throw new Error("Password must be at least 6 characters");
    const u: User = { ...input, email: input.email.trim(), id: uid(), createdAt: now() };
    commit((x) => { x.users.push(u); x.session = u.id; }, `${u.name} registered as ${u.role}`);
    return u;
  },
  logout() { commit((x) => { x.session = null; }); },
  saveElection(e: Omit<Election, "id" | "createdAt" | "status"> & { id?: string | undefined }) {
    commit((x) => {
      const ex = x.elections.find((y) => y.id === e.id);
      if (ex) Object.assign(ex, e);
      else x.elections.unshift({ ...e, id: uid(), status: "draft", createdAt: now() } as Election);
    }, `${e.id ? "Updated" : "Created"} election "${e.title}"`);
  },
  deleteElection(id: string) {
    commit((x) => {
      const t = x.elections.find((e) => e.id === id)?.title;
      x.elections = x.elections.filter((e) => e.id !== id);
      x.candidacies = x.candidacies.filter((c) => c.electionId !== id);
      x.votes = x.votes.filter((v) => v.electionId !== id);
      x.audit.unshift({ id: uid(), at: now(), actor: "admin", action: `Deleted election "${t}"` });
    });
  },
  setStatus(id: string, status: ElectionStatus) {
    commit((x) => { const e = x.elections.find((y) => y.id === id); if (e) e.status = status; }, `Election status → ${status}`);
  },
  reviewCandidacy(id: string, status: CandidacyStatus, note?: string) {
    commit((x) => { const c = x.candidacies.find((y) => y.id === id); if (c) { c.status = status; c.note = note; (c.history ??= []).push({ at: now(), label: status === "approved" ? "Approved — on the ballot" : status === "rejected" ? "Rejected" + (note ? `: ${note}` : "") : "Moved back to review" }); } }, `Candidacy ${status}`);
  },
  apply(electionId: string, positionId: string, manifesto: string, profile: NomineeProfile = {}) {
    const d = load();
    if (d.candidacies.some((c) => c.electionId === electionId && c.userId === d.session)) throw new Error("You already applied to this election");
    const n = d.candidacies.filter((c) => c.electionId === electionId).length + 1;
    const code = "N" + String(n).padStart(3, "0");
    commit((x) => { x.candidacies.push({ id: uid(), electionId, positionId, userId: x.session!, manifesto, profile, code, status: "pending", createdAt: now(), history: [{ at: now(), label: "Application submitted" }] }); }, "Submitted nomination");
  },
  updateManifesto(id: string, manifesto: string, profile?: NomineeProfile) {
    commit((x) => { const c = x.candidacies.find((y) => y.id === id); if (c) { c.manifesto = manifesto; if (profile) c.profile = profile; const re = c.status === "rejected"; if (re) { c.status = "pending"; c.note = undefined; } (c.history ??= []).push({ at: now(), label: re ? "Resubmitted after changes" : "Profile updated" }); } }, "Updated nominee profile");
  },
  withdraw(id: string) {
    commit((x) => { x.candidacies = x.candidacies.filter((c) => c.id !== id); }, "Withdrew candidacy");
  },
  castVote(electionId: string, selections: Record<string, string[]>, channel: "web" | "ussd" = "web"): Vote {
    const d = load();
    const e = d.elections.find((x) => x.id === electionId);
    if (!e || e.status !== "open" || new Date(e.endsAt).getTime() <= Date.now()) throw new Error("This election is not open");
    if (d.votes.some((v) => v.electionId === electionId && v.voterId === d.session)) throw new Error("You have already voted in this election");
    const v: Vote = { id: uid(), electionId, voterId: d.session!, selections, channel, castAt: now(), receipt: "RCPT-" + uid().toUpperCase() };
    commit((x) => { x.votes.push(v); }, `Ballot cast via ${channel}`);
    return v;
  },
  deleteUser(id: string) { commit((x) => { x.users = x.users.filter((u) => u.id !== id); }, "Removed a user"); },
  reset() { db = seed(); localStorage.setItem(KEY, JSON.stringify(db)); listeners.forEach((l) => l()); },
};

export function tally(d: DB, e: Election) {
  const votes = d.votes.filter((v) => v.electionId === e.id);
  return e.positions.map((p) => {
    const cands = d.candidacies.filter((c) => c.electionId === e.id && c.positionId === p.id && c.status === "approved");
    const rows = cands.map((c) => ({ c, user: d.users.find((u) => u.id === c.userId), count: votes.filter((v) => v.selections[p.id]?.includes(c.id)).length }));
    rows.sort((a, b) => b.count - a.count);
    const total = rows.reduce((s, r) => s + r.count, 0);
    return { position: p, rows, total };
  });
}

export const dashFor = (r: Role) => (r === "admin" ? "/admin" : r === "voter" ? "/voter" : "/candidate") as "/admin" | "/voter" | "/candidate";
export const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const newId = uid;
