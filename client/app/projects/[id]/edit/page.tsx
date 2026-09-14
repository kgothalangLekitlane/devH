"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { fetchProject, updateProject } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", techStack: "", githubUrl: "", liveUrl: "", imageUrl: "", category: "", status: "in-progress", featured: false, startedAt: "", completedAt: "" })

  useEffect(() => {
    if (!params?.id) return
    void fetchProject(params.id).then(body => {
      const p = body?.project
      if (!p) throw new Error("Project not found")
      if (user?.id && p.owner?.id && String(user.id) !== String(p.owner.id)) throw new Error("You can only edit your own projects.")
      setForm({ title: p.title || "", description: p.description || "", techStack: (p.techStack || []).join(", "), githubUrl: p.githubUrl || "", liveUrl: p.liveUrl || "", imageUrl: p.imageUrl || "", category: p.category || "", status: p.status || "in-progress", featured: !!p.featured, startedAt: p.startedAt ? String(p.startedAt).slice(0,10) : "", completedAt: p.completedAt ? String(p.completedAt).slice(0,10) : "" })
    }).catch(error => toast({ title: "Unable to load project", description: error instanceof Error ? error.message : "Please try again." })).finally(() => setLoading(false))
  }, [params?.id, user?.id, toast])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !params?.id) return
    if (!form.title.trim() || !form.description.trim()) return toast({ title: "Missing information", description: "Add a project title and description." })
    setSaving(true)
    try {
      await updateProject(params.id, { title: form.title.trim(), description: form.description.trim(), techStack: form.techStack.split(",").map(x => x.trim()).filter(Boolean), githubUrl: form.githubUrl.trim(), liveUrl: form.liveUrl.trim(), imageUrl: form.imageUrl.trim(), category: form.category.trim(), status: form.status, featured: form.featured, startedAt: form.startedAt || undefined, completedAt: form.completedAt || undefined }, token)
      toast({ title: "Project updated" }); router.push(`/projects/${params.id}`)
    } catch (error) { toast({ title: "Unable to save", description: error instanceof Error ? error.message : "Please try again." }) } finally { setSaving(false) }
  }

  if (loading) return <main className="grid min-h-screen place-items-center text-muted-foreground">Loading project...</main>

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><Button variant="ghost" asChild><Link href={`/projects/${params.id}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to project</Link></Button><div className="mt-6 mb-6"><p className="text-sm font-semibold text-cyan-500">Project workspace</p><h1 className="text-3xl font-extrabold">Edit project</h1><p className="mt-2 text-muted-foreground">Keep your portfolio entry accurate and recruiter-ready.</p></div><form onSubmit={save} className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm"><div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Project title</Label><Input className="mt-2" value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} /></div><div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-2 min-h-36" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} /></div><div className="sm:col-span-2"><Label>Technologies</Label><Input className="mt-2" placeholder="React, Node.js, MongoDB" value={form.techStack} onChange={e => setForm(v => ({ ...v, techStack: e.target.value }))} /><p className="mt-1 text-xs text-muted-foreground">Separate technologies with commas.</p></div><div><Label>Category</Label><Input className="mt-2" value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))} /></div><div><Label>Status</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}><option value="planning">Planning</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="maintained">Maintained</option></select></div><div><Label>GitHub URL</Label><Input className="mt-2" value={form.githubUrl} onChange={e => setForm(v => ({ ...v, githubUrl: e.target.value }))} /></div><div><Label>Live URL</Label><Input className="mt-2" value={form.liveUrl} onChange={e => setForm(v => ({ ...v, liveUrl: e.target.value }))} /></div><div className="sm:col-span-2"><Label>Cover image URL</Label><Input className="mt-2" value={form.imageUrl} onChange={e => setForm(v => ({ ...v, imageUrl: e.target.value }))} /></div><div><Label>Started</Label><Input className="mt-2" type="date" value={form.startedAt} onChange={e => setForm(v => ({ ...v, startedAt: e.target.value }))} /></div><div><Label>Completed</Label><Input className="mt-2" type="date" value={form.completedAt} onChange={e => setForm(v => ({ ...v, completedAt: e.target.value }))} /></div></div><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4"><input type="checkbox" checked={form.featured} onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))} /><span><span className="block font-medium">Feature this project</span><span className="text-sm text-muted-foreground">Highlight it as one of your strongest projects.</span></span></label><div className="flex justify-end gap-3"><Button type="button" variant="ghost" asChild><Link href={`/projects/${params.id}`}>Cancel</Link></Button><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save project"}</Button></div></form></div></main>
}
