import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode, type ButtonHTMLAttributes } from "react";
import { actions, currentUser, dashFor, useDB, type DB, type Role, type User } from "@/lib/store";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "brand" | "ghost" | "danger" | "soft"; size?: "sm" | "md" };
export function Btn({ variant = "brand", size = "md", className = "", ...p }: BtnProps) {
  const v = {
    brand: "bg-brand text-primary-foreground font-semibold hover:opacity-90",
    ghost: "border border-border bg-card text-foreground hover:bg-accent",
    soft: "bg-secondary text-foreground hover:bg-accent",
    danger: "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${v} ${s} ${className}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass p-5 ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint, tone = "mint" }: { label: string; value: ReactNode; hint?: string; tone?: "mint" | "cyan" | "amber" }) {
  const t = { mint: "text-mint", cyan: "text-cyan", amber: "text-amber" }[tone];
  return (
    <Card>
      <p className="label-cap">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {hint && <p className={`mt-1 text-[13px] font-medium ${t}`}>{hint}</p>}
    </Card>
  );
}

export function Bar({ pct, tone = "brand" }: { pct: number; tone?: "brand" | "mint" }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
      <div className={`h-full rounded-full transition-all duration-700 ${tone === "brand" ? "bg-brand" : "bg-mint"}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "text-mint border-mint/30 bg-mint/10", approved: "text-mint border-mint/30 bg-mint/10", published: "text-cyan border-cyan/30 bg-cyan/10",
    draft: "text-muted-foreground border-border bg-muted", pending: "text-amber border-amber/30 bg-amber/10",
    closed: "text-amber border-amber/30 bg-amber/10", rejected: "text-destructive border-destructive/30 bg-destructive/10",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${map[status] ?? map.draft}`}>{status}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="label-cap">{label}</span>{children}</label>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="glass max-h-[90vh] w-full max-w-xl overflow-y-auto bg-popover p-6 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">{children}</div>;
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-brand-diag font-display text-lg font-bold text-primary-foreground">B</div>
      <div>
        <p className="font-display text-[15px] font-semibold tracking-tight">Ballotglass</p>
        <p className="text-[11px] text-muted-foreground">Multi-channel voting</p>
      </div>
    </Link>
  );
}

export type Tab = { id: string; label: string };

/** Role-gated app shell. Renders children only for the matching signed-in role. */
export function Shell({ role, tabs, tab, onTab, children }: { role: Role; tabs: Tab[]; tab: string; onTab: (t: string) => void; children: (d: DB, me: User) => ReactNode }) {
  const d = useDB();
  const me = currentUser(d);
  const nav = useNavigate();
  useEffect(() => {
    if (!d) return;
    if (!me) nav({ to: "/auth", replace: true });
    else if (me.role !== role) nav({ to: dashFor(me.role), replace: true });
  }, [d, me, role, nav]);

  if (!d || !me || me.role !== role) return <div className="grid min-h-screen place-items-center bg-stage text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen w-full bg-stage">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <header className="glass flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Logo />
          <nav className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => onTab(t.id)} className={`rounded-full px-4 py-1.5 text-[13px] transition ${tab === t.id ? "bg-brand font-semibold text-primary-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground sm:block">
              <span className="capitalize">{me.role}</span> · <span className="text-foreground">{me.email}</span>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-brand-diag text-[12px] font-bold text-primary-foreground">{me.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
            <Btn variant="ghost" size="sm" onClick={() => { actions.logout(); nav({ to: "/auth", replace: true }); }}>Sign out</Btn>
          </div>
        </header>
        <main className="mt-7 animate-in fade-in slide-in-from-bottom-2 duration-500">{children(d, me)}</main>
      </div>
    </div>
  );
}
