import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Code2,
  Github,
  MessageCircle,
  Network,
  Sparkles,
  Users,
} from "lucide-react"

const highlights = [
  { icon: Network, title: "Meaningful connections", description: "Find people building in your space and turn introductions into opportunities." },
  { icon: Code2, title: "Work that speaks", description: "Give your projects a home where collaborators and hiring teams can discover them." },
  { icon: BriefcaseBusiness, title: "Career momentum", description: "Explore roles, meet recruiters, and keep the next step in your career moving." },
]

const steps = [
  "Build a profile around the work you are proud of.",
  "Share ideas, projects, and useful resources with the community.",
  "Meet collaborators and teams that are a great fit.",
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-grid absolute inset-0 opacity-40" />
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="DevHeaven home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-[#07111f] transition-transform group-hover:-rotate-6">
            <Code2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">DevHeaven</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden text-sm font-medium text-slate-300 transition-colors hover:text-white sm:block">Sign in</Link>
          <Link href="/signup" className="rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f] transition hover:bg-cyan-200 sm:px-5">Join the community</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1.5 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4 text-cyan-300" /> A better place to build your developer network
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Your next great <span className="text-cyan-300">connection</span> starts here.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
            DevHeaven brings developers, collaborators, and opportunities into one focused community—so the work you share can take you further.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 font-semibold text-[#07111f] transition hover:-translate-y-0.5 hover:bg-cyan-200">
              Create your profile <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:border-cyan-200/60 hover:bg-white/5">
              Explore DevHeaven
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="h-7 w-7 rounded-full border-2 border-[#07111f] bg-rose-300" />
              <span className="h-7 w-7 rounded-full border-2 border-[#07111f] bg-violet-300" />
              <span className="h-7 w-7 rounded-full border-2 border-[#07111f] bg-amber-200" />
            </div>
            Built for developers who want to grow together.
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-cyan-300/10 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/20 text-violet-200"><Users className="h-5 w-5" /></span><div><p className="font-semibold text-white">Your developer space</p><p className="text-sm text-slate-400">Everything in one place</p></div></div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-label="Online" />
            </div>
            <div className="space-y-3 py-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-cyan-200">Project spotlight</span><span className="text-xs text-slate-500">Just shared</span></div><p className="font-medium text-white">A portfolio people can actually explore</p><div className="mt-4 flex gap-2"><span className="rounded-full bg-cyan-300/15 px-2.5 py-1 text-xs text-cyan-100">React</span><span className="rounded-full bg-violet-300/15 px-2.5 py-1 text-xs text-violet-100">Design</span></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><MessageCircle className="mb-4 h-5 w-5 text-amber-200" /><p className="text-2xl font-semibold text-white">Connect</p><p className="mt-1 text-xs leading-5 text-slate-400">Start a conversation with your next collaborator.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><BookOpen className="mb-4 h-5 w-5 text-cyan-200" /><p className="text-2xl font-semibold text-white">Learn</p><p className="mt-1 text-xs leading-5 text-slate-400">Save resources worth coming back to.</p></div></div>
            </div>
            <div className="rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-[#07111f]">Share what you are building</div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-6xl divide-y divide-white/10 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {["Projects with a point", "Conversations that count", "Opportunities within reach"].map((item) => <p key={item} className="py-5 text-center text-sm font-medium text-slate-300">{item}</p>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Why DevHeaven</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">A community designed around momentum.</h2></div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">{highlights.map(({ icon: Icon, title, description }, index) => <article key={title} className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-white/[0.06]"><span className="mb-10 grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Icon className="h-5 w-5" /></span><p className="text-sm text-slate-500">0{index + 1}</p><h3 className="mt-2 text-xl font-semibold text-white">{title}</h3><p className="mt-3 leading-7 text-slate-400">{description}</p></article>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8"><div className="grid gap-10 rounded-[2rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-300/15 to-violet-400/10 p-8 md:grid-cols-[.9fr_1.1fr] md:p-12"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Make your move</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">Bring more of your work into the room.</h2></div><div><ul className="space-y-4">{steps.map((step) => <li key={step} className="flex gap-3 text-slate-200"><Check className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />{step}</li>)}</ul><Link href="/signup" className="mt-8 inline-flex items-center gap-2 font-semibold text-cyan-200 transition hover:text-white">Get started today <ArrowRight className="h-4 w-4" /></Link></div></div></section>

      <footer className="border-t border-white/10"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© {new Date().getFullYear()} DevHeaven. Built for people who build.</p><a href="https://github.com/kgothalangLekitlane/portfolio" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-cyan-200"><Github className="h-4 w-4" /> View the portfolio</a></div></footer>
    </main>
  )
}
