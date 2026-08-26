"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Code2, ExternalLink, Github, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, createProject, fetchProjects } from "@/lib/api"

type Project = {
  id: string
  title: string
  description: string
  techStack: string[]
  githubUrl?: string
  liveUrl?: string
  owner?: { id: string; firstName: string; lastName: string; username: string; profileImage?: string }
}

export default function ProjectsPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", techStack: "", githubUrl: "", liveUrl: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadProjects = async () => {
    setLoading(true)
    setError("")
    try {
      const body = await fetchProjects()
      setProjects(body?.projects || [])
    } catch (err: any) {
      setError(err?.message || "Unable to load projects")
    } finally { setLoading(false) }
  }

  useEffect(() => { loadProjects() }, [])

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => [p.title, p.description, ...(p.techStack || []), p.owner?.username || "", p.owner?.firstName || "", p.owner?.lastName || ""].join(" ").toLowerCase().includes(q))
  }, [projects, query])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setError("Please sign in to submit a project."); return }
    setSaving(true); setError("")
    try {
      await createProject({ ...form, techStack: form.techStack.split(",").map((x) => x.trim()).filter(Boolean) }, token)
      setForm({ title: "", description: "", techStack: "", githubUrl: "", liveUrl: "" })
      setShowForm(false)
      await loadProjects()
    } catch (err: any) { setError(err?.message || "Unable to create project") }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2"><Code2 className="h-8 w-8 text-purple-600" /><span className="text-2xl font-bold text-gray-900">DevHeaven</span></Link>
            <div className="hidden md:flex items-center space-x-6"><Link href="/dashboard" className="text-gray-600 hover:text-purple-600">Feed</Link><Link href="/projects" className="text-purple-600 font-medium">Projects</Link><Link href="/resources" className="text-gray-600 hover:text-purple-600">Resources</Link><Link href="/recruiters" className="text-gray-600 hover:text-purple-600">Jobs</Link></div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowForm((v) => !v)} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Submit Project</Button>
            <Link href="/profile"><Avatar className="h-8 w-8"><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback>{user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "?"}</AvatarFallback></Avatar></Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-2">Project Showcase</h1><p className="text-gray-600">Discover projects built by the DevHeaven community.</p></div>

        {showForm && <Card className="mb-8"><CardHeader><CardTitle>Submit a project</CardTitle><CardDescription>Add a real project to the community showcase.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><Input required placeholder="Project title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea required className="w-full min-h-28 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><Input placeholder="Tech stack (React, Node.js, MongoDB)" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} /><div className="grid md:grid-cols-2 gap-4"><Input type="url" placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} /><Input type="url" placeholder="Live demo URL" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} /></div><div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div></form></CardContent></Card>}

        <div className="relative mb-6"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search real projects..." className="pl-10" /></div>
        {error && <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading || authLoading ? <p className="text-gray-500">Loading projects...</p> : filteredProjects.length === 0 ? <Card><CardContent className="py-16 text-center"><h2 className="text-xl font-semibold text-gray-900">No projects yet</h2><p className="mt-2 text-gray-500">Be the first to submit a project to DevHeaven.</p>{user && <Button className="mt-5 bg-purple-600 hover:bg-purple-700" onClick={() => setShowForm(true)}>Submit your project</Button>}</CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredProjects.map((project) => { const ownerName = project.owner ? `${project.owner.firstName} ${project.owner.lastName}`.trim() : "DevHeaven member"; return <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow"><CardHeader><CardTitle className="text-lg">{project.title}</CardTitle><CardDescription className="line-clamp-3">{project.description}</CardDescription><div className="flex items-center gap-2 pt-2"><Avatar className="h-7 w-7"><AvatarImage src={assetUrl(project.owner?.profileImage)} /><AvatarFallback>{ownerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar><span className="text-sm text-gray-600">{ownerName}</span></div><div className="flex flex-wrap gap-1 pt-2">{project.techStack.slice(0, 5).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div></CardHeader><CardContent><div className="flex gap-2">{project.liveUrl && <Button asChild size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700"><a href={project.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />Live Demo</a></Button>}{project.githubUrl && <Button asChild size="sm" variant="outline"><a href={project.githubUrl} target="_blank" rel="noreferrer"><Github className="h-4 w-4 mr-2" />Code</a></Button>}</div></CardContent></Card>})}</div>}
      </main>
    </div>
  )
}
