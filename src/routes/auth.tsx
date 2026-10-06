import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Btn, Field, Logo } from "@/components/ui-kit";
import { actions, currentUser, dashFor, useDB } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Ballotglass" },
      { name: "description", content: "Sign in or create a voter or candidate account on Ballotglass." },
      { property: "og:title", content: "Sign in — Ballotglass" },
      { property: "og:description", content: "Sign in or create a voter or candidate account on Ballotglass." },
    ],
  }),
  component: AuthPage,
});

const demo = [
  { role: "Admin", email: "admin@vote.io", pw: "admin123" },
  { role: "Voter", email: "voter@vote.io", pw: "voter123" },
  { role: "Candidate", email: "cand@vote.io", pw: "cand123" },
];

function AuthPage() {
  const d = useDB();
  const me = currentUser(d);
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", role: "voter" as "voter" | "candidate" });

  useEffect(() => { if (me) nav({ to: dashFor(me.role), replace: true }); }, [me, nav]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const u = mode === "in" ? actions.login(f.email, f.password) : actions.register(f);
      nav({ to: dashFor(u.role), replace: true });
    } catch (x) { setErr((x as Error).message); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-stage p-4">
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-5">
        <div className="glass p-7 md:col-span-3">
          <Logo />
          <div className="mt-6 flex gap-1 rounded-full border border-border bg-card p-1">
            {(["in", "up"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} className={`flex-1 rounded-full py-1.5 text-[13px] transition ${mode === m ? "bg-brand font-semibold text-primary-foreground" : "text-muted-foreground"}`}>{m === "in" ? "Sign in" : "Create account"}</button>
            ))}
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (
              <>
                <Field label="I am a">
                  <div className="grid grid-cols-2 gap-2">
                    {(["voter", "candidate"] as const).map((r) => (
                      <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={`rounded-lg border px-3 py-2.5 text-[13px] capitalize transition ${f.role === r ? "border-cyan bg-cyan/10 text-foreground" : "border-border text-muted-foreground"}`}>{r}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Full name"><input required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                <Field label="Phone (for SMS / USSD)"><input required className="field" placeholder="+233…" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
              </>
            )}
            <Field label="Email"><input required type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Password"><input required type="password" className="field" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            {err && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{err}</p>}
            <Btn type="submit" className="w-full py-2.5">{mode === "in" ? "Sign in" : "Create account"}</Btn>
            {mode === "up" && <p className="text-[12px] text-muted-foreground">Admin accounts are created by existing administrators.</p>}
          </form>
        </div>
        <div className="glass p-7 md:col-span-2">
          <p className="label-cap">Demo accounts</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Data is stored in this browser only. Tap one to fill in.</p>
          <div className="mt-4 space-y-2">
            {demo.map((x) => (
              <button key={x.role} onClick={() => { setMode("in"); setF({ ...f, email: x.email, password: x.pw }); }} className="w-full rounded-xl border border-border bg-card p-3 text-left transition hover:border-cyan/50">
                <p className="text-[13px] font-semibold">{x.role}</p>
                <p className="text-[12px] text-muted-foreground">{x.email} · {x.pw}</p>
              </button>
            ))}
          </div>
          <button onClick={() => { actions.reset(); setErr(""); }} className="mt-6 text-[12px] text-muted-foreground underline-offset-4 hover:underline">Reset demo data</button>
        </div>
      </div>
    </div>
  );
}
