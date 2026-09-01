"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, fetchConnections, requestConnection, updateConnection } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Code2, Search, UserPlus, UserCheck, Clock3, Check, X, MapPin, Users, Sparkles } from "lucide-react"

export default function NetworkPage() {
  const { user, token, isLoading } = useAuth()
  const [people, setPeople] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [skill, setSkill] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("")
  const [stats, setStats] = useState({ connections: 0, pendingRequests: 0, extendedNetwork: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com").replace(/\/$/, "")

  const load = async () => {
    if (!token) return
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (skill.trim()) params.set("skill", skill.trim())
      if (location.trim()) params.set("location", location.trim())
      if (experience) params.set("experience", experience)
      const [suggestionResponse, connectionResponse, statsResponse] = await Promise.all([
        fetch(`${apiBase}/api/network/suggestions?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }).then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b?.error || "Unable to load suggestions"); return b }),
        fetchConnections(token),
        fetch(`${apiBase}/api/network/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b?.error || "Unable to load network stats"); return b }),
      ])
      setPeople(suggestionResponse.suggestions || [])
      setConnections(connectionResponse.connections || [])
      setStats(statsResponse)
    } catch (e: any) { setError(e?.message || "Unable to load your network") }
    finally { setLoading(false) }
  }

  useEffect(() => { if (!isLoading && user) void load() }, [isLoading, user, token, query, skill, location, experience])

  const incoming = connections.filter(c => c.status === "pending" && String(c.recipient?._id || c.recipient) === String(user?.id))
  const relation = (id: string) => connections.find(c => String(c.requester?._id || c.requester) === id || String(c.recipient?._id || c.recipient) === id)
  const visiblePeople = useMemo(() => people, [people])

  const connect = async (id: string) => { if (!token) return; setBusy(id); try { await requestConnection(id, token); await load() } catch (e: any) { setError(e?.message || "Unable to send request") } finally { setBusy(null) } }
  const respond = async (id: string, status: "accepted" | "rejected") => { if (!token) return; setBusy(id); try { await updateConnection(id, status, token); await load() } catch (e: any) { setError(e?.message || "Unable to update request") } finally { setBusy(null) } }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  return <div className="min-h-screen bg-gray-50">
    <nav className="bg-white border-b sticky top-0 z-50"><div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><Link href="/" className="flex items-center gap-2"><Code2 className="h-8 w-8 text-purple-600"/><span className="text-2xl font-bold">DevHeaven</span></Link><div className="hidden md:flex gap-6"><Link href="/dashboard">Feed</Link><Link href="/projects">Projects</Link><Link href="/network" className="text-purple-600 font-medium">Network</Link><Link href="/resources">Resources</Link><Link href="/recruiters">Jobs</Link></div><Link href="/profile"><Avatar className="h-8 w-8"><AvatarImage src={assetUrl(user.profileImage)}/><AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar></Link></div></nav>
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div><h1 className="text-3xl font-bold">Grow your developer network</h1><p className="text-gray-600 mt-2">Find developers who match your skills, experience and interests.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Card><CardContent className="p-5 flex items-center gap-4"><Users className="h-8 w-8 text-purple-600"/><div><p className="text-2xl font-bold">{stats.connections}</p><p className="text-sm text-gray-500">Connections</p></div></CardContent></Card><Card><CardContent className="p-5 flex items-center gap-4"><Clock3 className="h-8 w-8 text-purple-600"/><div><p className="text-2xl font-bold">{stats.pendingRequests}</p><p className="text-sm text-gray-500">Pending requests</p></div></CardContent></Card><Card><CardContent className="p-5 flex items-center gap-4"><Sparkles className="h-8 w-8 text-purple-600"/><div><p className="text-2xl font-bold">{stats.extendedNetwork}</p><p className="text-sm text-gray-500">Extended network</p></div></CardContent></Card></div>
      {incoming.length > 0 && <Card><CardHeader><CardTitle>Connection requests ({incoming.length})</CardTitle></CardHeader><CardContent className="space-y-3">{incoming.map(c => { const person = c.requester; const id = String(person?._id || person?.id || c.requester); return <div key={c._id} className="flex items-center justify-between gap-4 rounded-lg border p-3"><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(person?.profileImage)}/><AvatarFallback>{person?.firstName?.[0] || "U"}</AvatarFallback></Avatar><div><b>{person?.firstName} {person?.lastName}</b><p className="text-sm text-gray-500">@{person?.username || "developer"}</p></div></div><div className="flex gap-2"><Button size="sm" onClick={() => void respond(String(c._id), "accepted")} disabled={busy === String(c._id)}><Check className="h-4 w-4 mr-1"/>Accept</Button><Button size="sm" variant="outline" onClick={() => void respond(String(c._id), "rejected")} disabled={busy === String(c._id)}><X className="h-4 w-4 mr-1"/>Decline</Button></div></div>})}</CardContent></Card>}
      <Card><CardContent className="p-5 space-y-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/><Input className="pl-10" placeholder="Search developers by name, username or skill..." value={query} onChange={e => setQuery(e.target.value)}/></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><Input placeholder="Filter by skill (e.g. React)" value={skill} onChange={e => setSkill(e.target.value)}/><Input placeholder="Filter by location" value={location} onChange={e => setLocation(e.target.value)}/><select className="h-10 rounded-md border bg-white px-3 text-sm" value={experience} onChange={e => setExperience(e.target.value)}><option value="">Any experience</option><option value="0">0 years</option><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="5">5 years</option><option value="10">10+ years</option></select></div></CardContent></Card>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <p className="text-gray-500">Finding developers for you...</p> : visiblePeople.length === 0 ? <Card><CardContent className="py-16 text-center"><UserPlus className="mx-auto h-10 w-10 text-gray-400"/><h2 className="mt-3 font-semibold">No developers found</h2><p className="text-sm text-gray-500 mt-1">Try broadening your search or complete your profile to improve recommendations.</p></CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{visiblePeople.map(person => { const id = String(person._id || person.id); const r = relation(id); const isPendingFromMe = r?.status === "pending" && String(r.requester?._id || r.requester) === String(user.id); return <Card key={id} className="hover:shadow-md transition-shadow"><CardContent className="p-6"><div className="flex items-start justify-between"><Avatar className="h-14 w-14"><AvatarImage src={assetUrl(person.profileImage)}/><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar><div className="flex flex-col items-end gap-1">{person.sharedSkills > 0 && <Badge variant="secondary">{person.sharedSkills} shared skill{person.sharedSkills === 1 ? "" : "s"}</Badge>}{person.mutualConnections > 0 && <Badge variant="outline">{person.mutualConnections} mutual</Badge>}</div></div><h3 className="font-semibold text-lg mt-4">{person.firstName} {person.lastName}</h3><p className="text-sm text-gray-500">@{person.username}</p>{person.location && <p className="text-sm text-gray-600 mt-2 flex items-center gap-1"><MapPin className="h-3 w-3"/>{person.location}</p>}{person.experience != null && <p className="text-xs text-gray-500 mt-1">{person.experience} year{person.experience === 1 ? "" : "s"} experience</p>}<p className="text-sm text-gray-600 mt-3 line-clamp-2">{person.bio || "Developer on DevHeaven"}</p><div className="flex flex-wrap gap-1 mt-4">{(person.skills || []).slice(0, 5).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div><div className="flex gap-2 mt-5"><Button asChild variant="outline" className="flex-1"><Link href={`/profile/${id}`}>View profile</Link></Button>{r?.status === "accepted" ? <Button variant="outline" disabled><UserCheck className="h-4 w-4 mr-1"/>Connected</Button> : isPendingFromMe ? <Button variant="outline" disabled><Clock3 className="h-4 w-4 mr-1"/>Pending</Button> : <Button onClick={() => void connect(id)} disabled={busy === id}><UserPlus className="h-4 w-4 mr-1"/>Connect</Button>}</div></CardContent></Card>})}</div>}
    </main>
  </div>
}
