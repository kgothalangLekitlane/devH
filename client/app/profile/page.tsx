"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, updateMyProfile } from "@/lib/api"
import { formatLocalDateTime } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Code2, MapPin, Calendar, Pencil, Github, Linkedin, Globe, Twitter } from "lucide-react"

const safeUrl = (value?: string) => {
  const raw = String(value || "").trim()
  if (!raw) return ""
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try { const url = new URL(withProtocol); return ["http:", "https:"].includes(url.protocol) ? url.toString() : "" } catch { return "" }
}

export default function ProfilePage() {
  const { user, token, isLoading, login } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", bio: "", location: "", skills: "", github: "", linkedin: "", twitter: "", website: "", experience: "" })

  useEffect(() => {
    if (!user) return
    setForm({ firstName: user.firstName || "", lastName: user.lastName || "", bio: user.bio || "", location: user.location || "", skills: user.skills?.join(", ") || "", github: user.socialLinks?.github || "", linkedin: user.socialLinks?.linkedin || "", twitter: user.socialLinks?.twitter || "", website: user.socialLinks?.website || "", experience: user.experience?.toString() || "" })
  }, [user])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user || !token) return <div className="min-h-screen flex items-center justify-center"><Link href="/login">Sign in</Link></div>

  const save = async () => {
    setSaving(true); setError("")
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => data.append(key, value))
      data.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)
      if (image) data.append("profile", image)
      const result = await updateMyProfile(data, token)
      login(token, result.user)
      setImage(null); setPreview(""); setEditing(false)
    } catch (err: any) { setError(err.message || "Unable to update profile") }
    finally { setSaving(false) }
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
  const links = [
    { key: "github", label: "GitHub", icon: Github, url: safeUrl(user.socialLinks?.github) },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, url: safeUrl(user.socialLinks?.linkedin) },
    { key: "twitter", label: "Twitter", icon: Twitter, url: safeUrl(user.socialLinks?.twitter) },
    { key: "website", label: "Portfolio", icon: Globe, url: safeUrl(user.socialLinks?.website) },
  ].filter(link => link.url)

  return <div className="min-h-screen bg-gray-50">
    <nav className="bg-white border-b sticky top-0 z-50"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl"><Code2 className="text-purple-600" />DevHeaven</Link><Button variant="outline" onClick={() => setEditing(v => !v)}><Pencil className="h-4 w-4 mr-2" />{editing ? "Cancel" : "Edit Profile"}</Button></div></nav>
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card><CardContent className="pt-6 flex flex-col md:flex-row gap-6 items-center md:items-start"><Avatar className="h-28 w-28"><AvatarImage src={preview || assetUrl(user.profileImage)} /><AvatarFallback className="text-2xl">{initials}</AvatarFallback></Avatar><div className="flex-1 text-center md:text-left"><h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1><p className="text-gray-500">@{user.username}</p><p className="mt-4 text-gray-700 whitespace-pre-wrap">{user.bio || "Add a bio to tell the community about yourself."}</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">{user.location && <span className="flex gap-1 items-center"><MapPin className="h-4 w-4" />{user.location}</span>}{user.createdAt && <span className="flex gap-1 items-center"><Calendar className="h-4 w-4" />Joined {formatLocalDateTime(user.createdAt)}</span>}{user.timezone && <span>{user.timezone}</span>}</div><div className="mt-4 flex flex-wrap gap-2">{(user.skills || []).map(skill => <span key={skill} className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">{skill}</span>)}</div>{links.length > 0 && <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">{links.map(({ key, label, icon: Icon, url }) => <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"><Icon className="h-4 w-4" />{label}</a>)}</div>}</div></CardContent></Card>
      {editing && <Card><CardHeader><CardTitle>Edit your profile</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 gap-4"><div><Label>First name</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div><div><Label>Last name</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div><div className="md:col-span-2"><Label>Profile image</Label><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0] || null; setImage(file); if (preview) URL.revokeObjectURL(preview); setPreview(file ? URL.createObjectURL(file) : "") }} /><p className="text-xs text-gray-500 mt-1">JPG, PNG or WEBP, maximum 2 MB.</p></div><div className="md:col-span-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div><div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div><div><Label>Experience (years)</Label><Input type="number" min="0" max="80" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></div><div className="md:col-span-2"><Label>Skills</Label><Input placeholder="React, Node.js, Cybersecurity" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} /></div><div><Label>GitHub</Label><Input placeholder="https://github.com/username" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} /></div><div><Label>LinkedIn</Label><Input placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} /></div><div><Label>Twitter / X</Label><Input placeholder="https://x.com/username" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} /></div><div><Label>Portfolio / website</Label><Input placeholder="https://yourwebsite.com" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>{error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}<div className="md:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button></div></CardContent></Card>}
    </main>
  </div>
}
