import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, Check, ChevronDown, Vote, Smartphone, Trophy, Users, ShieldCheck, Globe, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Btn } from "@/components/ui-kit";
import { currentUser, dashFor, useDB } from "@/lib/store";
import community from "@/assets/ballotglass-community.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Ballotglass — Elections & awards, together" },
    { name: "description", content: "A place for every voice. Discover nominees, run community elections and celebrate exceptional people with Ballotglass." },
    { property: "og:title", content: "Ballotglass — Elections & awards, together" },
    { property: "og:description", content: "Discover nominees, cast your ballot and celebrate your community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

const uses = [
  { icon: Users, number: "01", title: "Campus & community", text: "Student councils, clubs and cooperatives. Bring your next chapter to a vote.", tag: "ELECTIONS" },
  { icon: Trophy, number: "02", title: "Talent worth celebrating", text: "Let remarkable people take the spotlight. Give every nominee a story, not just a name.", tag: "AWARDS" },
  { icon: Globe, number: "03", title: "A voice in every decision", text: "Boards, teams and associations. Make the choices that move you forward, together.", tag: "ORGANIZATIONS" },
];

function Home() {
  const d = useDB(); const me = currentUser(d);
  const [menu, setMenu] = useState(false);
  const destination = me ? dashFor(me.role) : "/auth";
  return <div className="landing min-h-screen bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background px-6 py-8 md:flex">
      <p className="label-cap">Your space</p>
      <nav aria-label="Account navigation" className="mt-5 flex flex-col gap-3">
        <Link to={destination} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium transition hover:border-mint/50 hover:text-mint">
          <LayoutDashboard size={17} /> {me ? "My dashboard" : "Dashboard"}
        </Link>
        <Link to={destination} className="landing-cta w-full justify-between">
          Get started <ArrowUpRight size={16} />
        </Link>
      </nav>
    </aside>
    <div className="md:ml-60">
    <header className="border-b border-border"><div className="landing-width flex h-20 items-center justify-between gap-6">
      <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold"><span className="grid size-9 place-items-center rounded-lg bg-mint text-background"><Vote size={22} strokeWidth={2} /></span>ballotglass<span className="text-mint">.</span></Link>
      <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground md:flex"><a href="#possibilities" className="transition hover:text-foreground">What’s possible</a><a href="#how-it-works" className="transition hover:text-foreground">How it works</a><a href="#questions" className="transition hover:text-foreground">FAQs</a></nav>
      <Btn variant="ghost" size="sm" className="md:hidden" aria-label={menu ? "Close navigation" : "Open navigation"} onClick={() => setMenu(!menu)}>{menu ? <X size={18} /> : <Menu size={18} />}</Btn>
    </div>{menu && <div className="fixed inset-0 z-40 bg-background/70 md:hidden" onClick={() => setMenu(false)}>
      <nav aria-label="Mobile navigation" className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-5 border-l border-border bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="label-cap">Your space</span>
          <Btn variant="ghost" size="sm" aria-label="Close navigation" onClick={() => setMenu(false)}><X size={18} /></Btn>
        </div>
        <Link to={destination} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium">
          <LayoutDashboard size={17} /> {me ? "My dashboard" : "Dashboard"}
        </Link>
        <Link to={destination} onClick={() => setMenu(false)} className="landing-cta w-full justify-between">
          Get started <ArrowUpRight size={16} />
        </Link>
        <div className="my-1 border-t border-border" />
        {[["#possibilities", "What’s possible"], ["#how-it-works", "How it works"], ["#questions", "FAQs"]].map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)} className="text-sm text-muted-foreground hover:text-foreground">{label}</a>)}
      </nav>
    </div>}</header>
    <main>
      <section className="landing-hero relative isolate overflow-hidden">
        <img src={community} alt="Students coming together to cast a ballot on campus" width={1920} height={1088} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="landing-veil absolute inset-0 -z-10" />
        <div className="landing-width relative py-16 sm:py-20 lg:py-24">
          <p className="mb-7 flex items-center gap-2.5 text-xs font-medium text-mint"><span className="size-1.5 rounded-full bg-mint" /> BIG DECISIONS. EVERYDAY PEOPLE.</p>
          <h1 className="max-w-xl text-[48px] font-medium leading-[1.08] sm:text-[64px] lg:text-[72px]">Ballotglass.<br />Every voice<br /><span className="text-mint">in the picture.</span></h1>
          <p className="mt-6 max-w-sm text-[15px] leading-7 text-hero-muted">From the next student leader to the next breakout talent. Bring your community together, one vote at a time.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5"><Link to={destination} className="landing-cta">Make your vote count <ArrowUpRight size={18} /></Link><a href="#how-it-works" className="flex items-center gap-2 text-sm">Take a closer look <ArrowRight size={16} /></a></div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-hero-muted"><span className="flex items-center gap-2"><Check size={14} className="text-mint" /> Elections & awards</span><span className="flex items-center gap-2"><Check size={14} className="text-mint" /> Web & USSD</span></div>
        </div>
        <div className="absolute bottom-8 right-10 hidden border-l border-hero-muted/30 pl-4 text-xs text-hero-muted lg:block">Different stories.<br /><span className="mt-1 block text-foreground">One community.</span></div>
      </section>
      <div className="border-y border-border bg-secondary/40"><div className="landing-width grid gap-6 py-7 sm:grid-cols-3"><div className="flex items-center gap-3"><Vote size={20} className="text-mint" /><p className="text-sm">One ballot. A meaningful choice.</p></div><div className="flex items-center gap-3"><Smartphone size={20} className="text-cyan" /><p className="text-sm">Online or on a simple phone.</p></div><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-amber" /><p className="text-sm">A receipt for every vote.</p></div></div></div>
      <section id="possibilities" className="landing-width py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs text-mint">MADE FOR YOUR PEOPLE</p><h2 className="mt-4 text-3xl font-medium sm:text-4xl">Your community.<br />Your next big moment.</h2></div><p className="max-w-sm text-sm leading-6 text-muted-foreground">Some choices shape a year. Some launch a career.<br />Make space for the voices that matter.</p></div><div className="mt-12 grid gap-8 md:grid-cols-3">{uses.map(({ icon: Icon, ...use }) => <article key={use.number} className="border-t border-border pt-6"><div className="flex items-center justify-between"><Icon size={28} className="text-mint" /><span className="font-mono text-xs text-muted-foreground">/{use.number}</span></div><p className="mt-8 text-[10px] text-muted-foreground">{use.tag}</p><h3 className="mt-3 text-xl">{use.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{use.text}</p><Link to={destination} className="mt-6 inline-flex items-center gap-2 text-xs text-mint">Get involved <ArrowUpRight size={15} /></Link></article>)}</div></section>
      <section id="how-it-works" className="border-y border-border bg-secondary/40"><div className="landing-width py-16"><p className="text-xs text-cyan">FROM FIRST NAME TO FINAL COUNT</p><h2 className="mt-4 text-3xl font-medium">A better way to come together.</h2><div className="mt-10 grid gap-8 sm:grid-cols-3">{[["01", "Meet the nominees", "The stories, achievements and ambitions behind every name."], ["02", "Make your choice", "Compare the people on your ballot and vote for what matters to you."], ["03", "Celebrate the outcome", "Keep your receipt and come back for the published results."]].map(([n, title, text]) => <div key={n}><span className="font-mono text-sm text-cyan">{n} —</span><h3 className="mt-4 text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>
      <section id="questions" className="landing-width grid gap-10 py-20 md:grid-cols-2"><div><p className="text-xs text-mint">GOOD TO KNOW</p><h2 className="mt-4 text-3xl font-medium">A little clarity.</h2></div><div className="space-y-1">{[["Who can take part?", "Create a voter or candidate account, or sign in with one of the demo accounts. Each role has its own space."], ["When does voting close?", "Voting closes automatically at the election’s deadline. Administrators cannot close an active election early."], ["Can I change a submitted ballot?", "No. You can review and change your choices before submitting, but a recorded ballot cannot be changed."], ["Is this ready for a real election?", "Not yet. This is a frontend demo: accounts, uploads and ballots stay in this browser. USSD is simulated, and data is not shared across devices."]].map(([q, a]) => <details key={q} className="group border-b border-border py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm">{q}<ChevronDown size={16} className="shrink-0 text-muted-foreground transition group-open:rotate-180" /></summary><p className="mt-4 text-sm leading-6 text-muted-foreground">{a}</p></details>)}</div></section>
      <section className="border-t border-border"><div className="landing-width flex flex-wrap items-center justify-between gap-6 py-14"><div><p className="text-xs text-mint">THE NEXT CHAPTER IS YOURS</p><h2 className="mt-3 text-3xl font-medium">Let’s make it count.</h2></div><Link to={destination} className="landing-cta">Join Ballotglass <ArrowUpRight size={18} /></Link></div></section>
    </main>
    <footer className="border-t border-border"><div className="landing-width flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-muted-foreground"><Link to="/" className="font-display text-base text-foreground">ballotglass<span className="text-mint">.</span></Link><p>© {new Date().getFullYear()} Ballotglass</p><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-amber" /> Local demo · saved in this browser</span></div></footer>
    </div>
  </div>;
}
