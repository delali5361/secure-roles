import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ClipboardList,
  CreditCard,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Smartphone,
  UserRound,
  UserRoundCheck,
  UsersRound,
  Vote,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { actions, currentUser, dashFor, useDB, type DB, type Role, type User } from "@/lib/store";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "brand" | "ghost" | "danger" | "soft";
  size?: "sm" | "md";
};
export function Btn({ variant = "brand", size = "md", className = "", ...p }: BtnProps) {
  const v = {
    brand: "bg-brand text-primary-foreground font-semibold hover:opacity-90",
    ghost: "border border-border bg-card text-foreground hover:bg-accent",
    soft: "bg-secondary text-foreground hover:bg-accent",
    danger:
      "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2 text-[13px]";
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition disabled:opacity-40 disabled:pointer-events-none ${v} ${s} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass p-5 ${className}`}>{children}</section>;
}

export function Stat({
  label,
  value,
  hint,
  tone = "mint",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "mint" | "cyan" | "amber";
}) {
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
      <div
        className={`h-full rounded-full transition-all duration-700 ${tone === "brand" ? "bg-brand" : "bg-mint"}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "text-mint border-mint/30 bg-mint/10",
    approved: "text-mint border-mint/30 bg-mint/10",
    published: "text-cyan border-cyan/30 bg-cyan/10",
    draft: "text-muted-foreground border-border bg-muted",
    pending: "text-amber border-amber/30 bg-amber/10",
    closed: "text-amber border-amber/30 bg-amber/10",
    rejected: "text-destructive border-destructive/30 bg-destructive/10",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${map[status] ?? map["draft"]}`}
    >
      {status}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label-cap">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass max-h-[90vh] w-full max-w-xl overflow-y-auto bg-popover p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Ballotglass home"
      title={compact ? "Ballotglass" : undefined}
      className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-brand-diag font-display text-lg font-bold text-primary-foreground">
        B
      </div>
      {!compact && (
        <div>
          <p className="font-display text-[15px] font-semibold tracking-tight">Ballotglass</p>
          <p className="text-[11px] text-muted-foreground">Multi-channel voting</p>
        </div>
      )}
    </Link>
  );
}

export type Tab = { id: string; label: string };

const tabIcons: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  elections: Vote,
  candidates: UserRound,
  users: UsersRound,
  results: ChartNoAxesCombined,
  payments: CreditCard,
  audit: ClipboardList,
  home: Vote,
  receipts: ReceiptText,
  ussd: Smartphone,
  mine: UserRoundCheck,
  apply: FilePlus2,
};

/** Role-gated app shell. Renders children only for the matching signed-in role. */
export function Shell({
  role,
  tabs,
  tab,
  onTab,
  children,
}: {
  role: Role;
  tabs: Tab[];
  tab: string;
  onTab: (t: string) => void;
  children: (d: DB, me: User) => ReactNode;
}) {
  const d = useDB();
  const me = currentUser(d);
  const nav = useNavigate();
  const sidebar = role === "admin" || role === "voter" || role === "candidate";
  const sectionLabel =
    role === "admin" ? "Administration" : `${role[0].toUpperCase()}${role.slice(1)} dashboard`;
  const navigationLabel = `${role[0].toUpperCase()}${role.slice(1)} dashboard`;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavExpanded, setDesktopNavExpanded] = useState(true);
  useEffect(() => {
    if (!d) return;
    if (!me) nav({ to: "/auth", replace: true });
    else if (me.role !== role) nav({ to: dashFor(me.role), replace: true });
  }, [d, me, role, nav]);

  if (!d || !me || me.role !== role)
    return (
      <div className="grid min-h-screen place-items-center bg-stage text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-stage">
      {sidebar && (
        <aside
          className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-border bg-background/90 px-3 py-6 backdrop-blur transition-[width] duration-200 md:flex ${desktopNavExpanded ? "w-60" : "w-[4.75rem]"}`}
        >
          <div
            className={`flex items-center ${desktopNavExpanded ? "justify-between" : "flex-col gap-2"}`}
          >
            <Logo compact={!desktopNavExpanded} />
            {desktopNavExpanded && (
              <button
                type="button"
                aria-label="Collapse navigation"
                onClick={() => setDesktopNavExpanded(false)}
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <ChevronLeft size={17} />
              </button>
            )}
            {!desktopNavExpanded && (
              <button
                type="button"
                aria-label="Expand navigation"
                title="Expand navigation"
                onClick={() => setDesktopNavExpanded(true)}
                className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <ChevronRight size={15} />
              </button>
            )}
          </div>
          {desktopNavExpanded && <p className="label-cap mt-10 px-3">{sectionLabel}</p>}
          <nav
            aria-label={navigationLabel}
            className={`mt-3 flex flex-1 flex-col gap-1 ${desktopNavExpanded ? "" : "items-center"}`}
          >
            {tabs.map((t) => (
              <SidebarTab
                key={t.id}
                item={t}
                active={tab === t.id}
                compact={!desktopNavExpanded}
                onClick={() => onTab(t.id)}
              />
            ))}
          </nav>
          <div
            className={`border-t border-border pt-4 ${desktopNavExpanded ? "" : "flex justify-center"}`}
          >
            {desktopNavExpanded && (
              <p className="truncate px-3 text-[12px] text-muted-foreground">{me.email}</p>
            )}
            <Btn
              aria-label="Sign out"
              title={!desktopNavExpanded ? "Sign out" : undefined}
              className={`mt-3 ${desktopNavExpanded ? "w-full" : "size-10 !px-0"}`}
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.logout();
                nav({ to: "/auth", replace: true });
              }}
            >
              {!desktopNavExpanded && <LogOut size={16} />}
              {desktopNavExpanded && "Sign out"}
            </Btn>
          </div>
        </aside>
      )}
      <div
        className={`mx-auto max-w-[1440px] px-4 py-6 sm:px-6 ${sidebar ? (desktopNavExpanded ? "md:ml-60" : "md:ml-[4.75rem]") : ""}`}
      >
        <header className="glass flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          {!sidebar && <Logo />}
          {sidebar && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={`Open ${role} navigation`}
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              >
                <Menu size={18} />
              </button>
              <h1 className="font-display text-lg font-semibold">
                {tabs.find((t) => t.id === tab)?.label ?? sectionLabel}
              </h1>
            </div>
          )}
          {!sidebar && (
            <nav className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-[13px] transition ${tab === t.id ? "bg-brand font-semibold text-primary-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground sm:block">
              <span className="capitalize">{me.role}</span> ·{" "}
              <span className="text-foreground">{me.email}</span>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-brand-diag text-[12px] font-bold text-primary-foreground">
              {me.name
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </div>
            <Btn
              className={sidebar ? "md:hidden" : ""}
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.logout();
                nav({ to: "/auth", replace: true });
              }}
            >
              Sign out
            </Btn>
          </div>
        </header>
        {sidebar && mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <aside
              aria-label={`${navigationLabel} navigation`}
              className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-border bg-background p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  aria-label={`Close ${role} navigation`}
                  onClick={() => setMobileNavOpen(false)}
                  className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="label-cap mt-10 px-3">{sectionLabel}</p>
              <nav aria-label={navigationLabel} className="mt-3 flex flex-1 flex-col gap-1">
                {tabs.map((t) => (
                  <SidebarTab
                    key={t.id}
                    item={t}
                    active={tab === t.id}
                    onClick={() => {
                      onTab(t.id);
                      setMobileNavOpen(false);
                    }}
                  />
                ))}
              </nav>
              <div className="border-t border-border pt-4">
                <p className="truncate px-3 text-[12px] text-muted-foreground">{me.email}</p>
                <Btn
                  className="mt-3 w-full"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileNavOpen(false);
                    actions.logout();
                    nav({ to: "/auth", replace: true });
                  }}
                >
                  Sign out
                </Btn>
              </div>
            </aside>
          </div>
        )}
        <main className="mt-7 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children(d, me)}
        </main>
      </div>
    </div>
  );
}

function SidebarTab({
  item,
  active,
  compact = false,
  onClick,
}: {
  item: Tab;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = tabIcons[item.id] ?? CircleDot;
  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={compact ? item.label : undefined}
      onClick={onClick}
      className={`flex min-h-10 items-center rounded-lg text-[13px] transition ${
        compact ? "w-10 justify-center px-0" : "w-full gap-3 px-3 text-left"
      } ${
        active
          ? "bg-brand font-semibold text-primary-foreground"
          : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
      {!compact && <span>{item.label}</span>}
    </button>
  );
}
