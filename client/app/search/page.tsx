"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseBusiness, Code2, FileText, FolderKanban, Search, Users, RefreshCw, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { fetchJobs, fetchPosts, fetchProjects, fetchResources, searchCandidates } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { assetUrl } from "@/lib/api"

type Result = { id: string; title: string; description?: string; href: string; meta?: string; image?: string; tags?: string[] }
type Results = { people: Result[]; projects: Result[]; jobs: Result[]; resources: Result[]; posts: Result[] }

const emptyResults: Results = { people: [], projects: [], jobs: [], resources: [], posts: [] }

export default function SearchPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [initialQuery, setInitialQuery] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Results>(emptyResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("q")?.trim() || ""
    setInitialQuery(value)
    setQuery(value)
  }, [])

  useEffect(() => { setQuery(initialQuery) }, [initialQuery])

  useEffect(() => {
    if (authLoading || !token || !initialQuery) { setResults(emptyResults); return }
    let cancelled = false
    setLoading(true); setError("")
    const run = async () => {
      const q = initialQuery
      const [people, projects, jobs, resources, posts] = await Promise.allSettled([
        searchCandidates(q, token), fetchProjects(), fetchJobs({ q, limit: 12 }), fetchResources(), fetchPosts(1, 50)
      ])
      if (cancelled) return
      const next: Results = { ...emptyResults }
      if (people.status === "fulfilled") {
        const list: any[] = Array.isArray(people.value) ? people.value : people.value?.users || people.value?.candidates || []
        next.people = list.slice(0, 12).map((u: any) => ({ id: String(u._id || u.id), title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Developer", description: u.headline || u.bio, href: `/profile/${u._id || u.id}`, meta: u.username ? `@${u.username}` : u.location, image: u.profileImage }))
      }
      if (projects.status === "fulfilled") {
        const list: any[] = Array.isArray(projects.value) ? projects.value : projects.value?.projects || []
        next.projects = list.filter(p => `${p.title || ""} ${p.description || ""} ${(p.techStack || []).join(" ")} ${p.category || ""}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12).map((p: any) => ({ id: String(p._id || p.id), title: p.title || "Untitled project", description: p.description, href: `/projects/${p._id || p.id}`, meta: p.category || p.status, tags: p.techStack || [] }))
      }
      if (jobs.status === "fulfilled") {
        const body: any = jobs.value; const list: any[] = Array.isArray(body) ? body : body?.jobs || []
        next.jobs = list.slice(0, 12).map((j: any) => ({ id: String(j._id || j.id), title: j.title || j.role || "Open position", description: j.description || j.summary, href: `/jobs/${j._id || j.id}`, meta: [j.company?.name || j.company, j.location, j.remote ? "Remote" : ""].filter(Boolean).join(" · "), tags: j.skills || j.requiredSkills || [] }))
      }
      if (resources.status === "fulfilled") {
        const list: any[] = Array.isArray(resources.value) ? resources.value : resources.value?.resources || []
        next.resources = list.filter(r => `${r.title || ""} ${r.description || ""} ${r.category || ""}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12).map((r: any) => ({ id: String(r._id || r.id), title: r.title || r.name || "Resource", description: r.description, href: r.url || r.link || "/resources", meta: r.category || r.type }))
      }
      if (posts.status === "fulfilled") {
        const list: any[] = Array.isArray(posts.value) ? posts.value : posts.value?.posts || []
        next.posts = list.filter(p => `${p.title || ""} ${p.content || p.body || ""} ${p.author?.username || p.user?.username || ""}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12).map((p: any) => ({ id: String(p._id || p.id), title: p.title || "Community post", description: p.content || p.body, href: `/community/${p._id || p.id}`, meta: p.author?.username ? `@${p.author.username}` : "Community" }))
      }
      setResults(next)
      if ([people, projects, jobs, resources, posts].every(r => r.status === "rejected")) setError("Search is temporarily unavailable. Please try again.")
      setLoading(false)
    }
    void run()
    return () => { cancelled = true }
  }, [authLoading, token, initialQuery])

  const total = useMemo(() => Object.values(results).reduce((sum, list) => sum + list.length, 0), [results])
  const sections = [
    { key: "people" as const, label: "People", icon: Users },
    { key: "projects" as const, label: "Projects", icon: FolderKanban },
    { key: "jobs" as const, label: "Jobs", icon: BriefcaseBusiness },
    { key: "resources" as const, label: "Resources", icon: FileText },
    { key: "posts" as const, label: "Community", icon: Code2 },
  ]

  return <main className="min-h-screen bg-background text-foreground">
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600"><Code2 className="h-5 w-5 text-white" /></span>Dev<span className="text-cyan-400">Heaven</span></Link>
        <form action="/search" className="ml-auto flex w-full max-w-xl items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" /><Input name="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people, projects, jobs, resources..." className="border-0 bg-transparent focus-visible:ring-0" /><Button type="submit" size="sm">Search</Button>
        </form>
        <Link href="/dashboard" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Dashboard</Link>
      </div>
    </nav>

    <div className="mx-auto max-w-7xl px-4 py-8">
      {!initialQuery ? <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center"><Search className="mx-auto h-10 w-10 text-muted-foreground" /><h1 className="mt-4 text-2xl font-bold">Search DevHeaven</h1><p className="mt-2 text-muted-foreground">Find developers, projects, opportunities, resources and community posts.</p></div> : <>
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-cyan-500">Global search</p><h1 className="text-3xl font-extrabold">Results for “{initialQuery}”</h1></div><Badge variant="secondary">{loading ? "Searching..." : `${total} result${total === 1 ? "" : "s"}`}</Badge></div>
        {loading && <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Searching across DevHeaven...</div>}
        {error && <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
        {!loading && total === 0 && !error && <div className="rounded-3xl border border-border bg-card p-12 text-center"><Search className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">No results found</h2><p className="mt-2 text-muted-foreground">Try a different name, skill, technology, company or keyword.</p></div>}
        <div className="mt-6 space-y-8">
          {sections.map(section => { const Icon = section.icon; const list = results[section.key]; if (!list.length) return null; return <section key={section.key}><div className="mb-3 flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-500" /><h2 className="text-lg font-bold">{section.label}</h2><Badge variant="outline">{list.length}</Badge></div><div className="grid gap-3 md:grid-cols-2">{list.map(item => <Link key={`${section.key}-${item.id}`} href={item.href} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-lg"><div className="flex gap-4">{section.key === "people" ? <Avatar className="h-11 w-11 shrink-0"><AvatarImage src={assetUrl(item.image)} /><AvatarFallback>{item.title.split(" ").map(x => x[0]).join("").slice(0,2)}</AvatarFallback></Avatar> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted"><Icon className="h-5 w-5 text-cyan-500" /></span>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold group-hover:text-cyan-500">{item.title}</h3><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></div>{item.meta && <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>}{item.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}{item.tags?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{item.tags.slice(0,5).map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}</div> : null}</div></div></Link>)}</div></section> })}
        </div>
      </>}
    </div>
  </main>
}
