"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Code2,
  Github,
  Menu,
  MessageCircle,
  Network,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react"

const words = ["build", "connect", "get discovered", "move forward"]

const navItems = [
  ["#features", "Features"],
  ["#workflow", "How it works"],
  ["#community", "Community"],
]

const capabilities = [
  { icon: Code2, label: "Developer profiles", text: "Skills, projects, experience and your story in one place.", href: "/profile" },
  { icon: Network, label: "Professional network", text: "Discover developers, collaborators and people worth knowing.", href: "/network" },
  { icon: MessageCircle, label: "Direct conversations", text: "Turn a connection into an actual conversation.", href: "/messages" },
  { icon: BriefcaseBusiness, label: "Jobs & recruitment", text: "Explore roles or find candidates without leaving DevHeaven.", href: "/jobs" },
]

const steps = [
  ["01", "Create your identity", "Build a developer profile around the work you actually want people to see."],
  ["02", "Show your work", "Projects, posts and resources give your profile something real to discover."],
  ["03", "Meet the right people", "Connect with developers, recruiters and collaborators who share your direction."],
  ["04", "Turn connection into opportunity", "Move from profile to conversation, project or career opportunity."],
]

export default function LandingPage() {
  const [word, setWord] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setWord((value) => (value + 1) % words.length), 2300)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040814] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="hero-noise absolute inset-0" />
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-orb hero-orb-three" />
      </div>

      <nav className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:py-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="DevHeaven home">
          <span className="logo-pulse grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-[0_0_35px_rgba(103,232,249,.25)]"><Code2 className="h-5 w-5" /></span>
          <span className="text-lg font-bold tracking-tight">DevHeaven<span className="text-cyan-300">.</span></span>
        </Link>
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map(([href, label]) => <a key={href} href={href} className="text-sm text-slate-400 transition hover:text-white">{label}</a>)}
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white">Sign in</Link>
          <Link href="/signup" className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-200">Join DevHeaven</Link>
        </div>
        <button type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 sm:hidden">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen && <div className="relative z-40 mx-5 rounded-2xl border border-white/10 bg-[#07101f]/95 p-3 shadow-2xl backdrop-blur-xl sm:hidden">
        {navItems.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white">{label}</a>)}
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3"><Link href="/login" className="rounded-xl px-4 py-3 text-center text-sm text-slate-300">Sign in</Link><Link href="/signup" className="rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-bold text-slate-950">Join</Link></div>
      </div>}

      <section className="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[.94fr_1.06fr] lg:items-center lg:gap-20 lg:pb-32 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-100"><Sparkles className="h-4 w-4 text-cyan-300" /> Built for people who build</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl lg:text-[5.4rem]">Your work.<br /><span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">Your people.</span><br /><span className="text-slate-500">Your next move.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">DevHeaven is the developer community where your profile, projects, network, conversations and career opportunities finally live together.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:bg-cyan-200">Create your profile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link href="/jobs" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-6 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/10">Explore opportunities</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-400">{["Show your work", "Grow your network", "Find opportunity"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />{item}</span>)}</div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-10 rounded-[4rem] bg-gradient-to-r from-cyan-500/15 via-violet-500/20 to-fuchsia-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111f]/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" /></div><span className="font-mono text-[10px] uppercase tracking-[.2em] text-slate-500">devheaven / workspace</span><Zap className="h-4 w-4 text-cyan-300" /></div>
            <div className="grid gap-4 p-5 sm:grid-cols-[.92fr_1.08fr] sm:p-7">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 font-bold text-slate-950">DK</div><div><p className="font-semibold">Developer profile</p><p className="text-xs text-slate-500">Full-stack developer</p></div></div>
                <div className="mt-6 flex flex-wrap gap-2">{["React", "Node.js", "MongoDB", "TypeScript"].map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">{tag}</span>)}</div>
                <div className="mt-7 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Profile</span><span className="text-cyan-200">Discoverable</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" /></div></div>
                <Link href="/profile" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 hover:text-cyan-100">View profile <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 to-violet-400/10 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Featured project</span><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-200">Open to collaborate</span></div><h3 className="mt-5 text-xl font-semibold">Build. Share. Get discovered.</h3><p className="mt-2 text-sm leading-6 text-slate-400">Give your work a home and make it easier for the right people to find you.</p><div className="mt-5 flex gap-2"><span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">Project</span><span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">Portfolio</span></div></div>
                <div className="grid grid-cols-2 gap-4"><Link href="/network" className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-violet-300/30"><Network className="h-5 w-5 text-violet-300" /><p className="mt-8 font-semibold">Network</p><p className="mt-1 text-xs leading-5 text-slate-500">Find your people.</p></Link><Link href="/jobs" className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-cyan-300/30"><BriefcaseBusiness className="h-5 w-5 text-cyan-300" /><p className="mt-8 font-semibold">Jobs</p><p className="mt-1 text-xs leading-5 text-slate-500">Find your next move.</p></Link></div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.025] px-5 py-4 text-center text-sm text-slate-400">One profile can open <span className="font-semibold text-white">{words[word]}</span>.<span className="ml-1 text-cyan-300">_</span></div>
          </div>
        </div>
      </section>

      <section id="community" className="relative z-10 border-y border-white/10 bg-white/[.025]"><div className="mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, label, text, href }, i) => <Link key={label} href={href} className="group border-b border-white/10 p-6 transition hover:bg-white/[.04] lg:border-b-0 lg:border-r lg:last:border-r-0"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Icon className="h-5 w-5" /></span><span className="font-mono text-[10px] text-slate-600">0{i + 1}</span></div><h3 className="mt-6 font-semibold">{label}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><ArrowRight className="mt-5 h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></Link>)}</div></section>

      <section id="features" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">The DevHeaven difference</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Not another empty developer profile.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-400">The platform is designed around what happens after you create a profile: people discover your work, conversations start, connections grow and opportunities become easier to reach.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3"><article className="feature-card feature-cyan rounded-3xl border border-white/10 bg-white/[.035] p-7 md:col-span-2"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Code2 className="h-5 w-5" /></span><span className="text-xs uppercase tracking-[.18em] text-slate-600">Identity</span></div><h3 className="mt-16 text-2xl font-semibold">Make your profile the starting point.</h3><p className="mt-3 max-w-xl leading-7 text-slate-400">Bring skills, experience, projects and ambitions together so people understand what you can do—not just what your CV says.</p><Link href="/signup" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">Build your identity <ArrowRight className="h-4 w-4" /></Link></article><article className="feature-card feature-violet rounded-3xl border border-white/10 bg-white/[.035] p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Users className="h-5 w-5" /></span><h3 className="mt-16 text-2xl font-semibold">Find people, not numbers.</h3><p className="mt-3 leading-7 text-slate-400">Build a network around shared skills, interests, projects and goals.</p><Link href="/network" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-violet-200">Explore network <ArrowRight className="h-4 w-4" /></Link></article><article className="feature-card feature-amber rounded-3xl border border-white/10 bg-white/[.035] p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-300/10 text-amber-200"><MessageCircle className="h-5 w-5" /></span><h3 className="mt-16 text-2xl font-semibold">Turn visibility into action.</h3><p className="mt-3 leading-7 text-slate-400">Message people, collaborate on work and take the next step while the context is still fresh.</p><Link href="/messages" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">Start connecting <ArrowRight className="h-4 w-4" /></Link></article></div></section>

      <section id="workflow" className="relative z-10 border-y border-white/10 bg-[#070e1b]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-violet-300">How it works</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">From profile to possibility.</h2><p className="mt-5 leading-7 text-slate-400">Everything starts with a profile, but it does not stop there.</p><Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5">Start building <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3">{steps.map(([number, title, text]) => <div key={number} className="group flex gap-5 rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-cyan-300/20 hover:bg-white/[.045]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300/10 font-mono text-xs font-bold text-cyan-200">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}</div></div></section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/15 via-violet-400/10 to-fuchsia-400/10 p-8 shadow-[0_30px_100px_rgba(34,211,238,.07)] md:p-12"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-200">Ready when you are</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Build a presence that can move with you.</h2><p className="mt-4 max-w-xl text-lg leading-7 text-slate-300">Create your profile, put your work out there and start meeting the people who can take the next step with you.</p></div><Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-7 py-4 font-bold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-1 hover:bg-cyan-200">Join DevHeaven <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></div></section>

      <footer className="relative z-10 border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-9 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-white">DevHeaven<span className="text-cyan-300">.</span></p><p className="mt-1">A community for people who build.</p></div><div className="flex flex-wrap items-center gap-5"><Link href="/profile" className="hover:text-white">Profiles</Link><Link href="/network" className="hover:text-white">Network</Link><Link href="/jobs" className="hover:text-white">Jobs</Link><Link href="/resources" className="hover:text-white">Resources</Link><a href="https://github.com/kgothalangLekitlane/portfolio" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cyan-200"><Github className="h-4 w-4" /> Portfolio</a></div><span>© {new Date().getFullYear()} DevHeaven</span></div></footer>
    </main>
  )
}
