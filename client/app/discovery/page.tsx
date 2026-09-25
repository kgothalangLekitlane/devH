"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Compass, Search, UserPlus, UserCheck, Clock3, Check, X, MapPin, Users, Sparkles, SlidersHorizontal, Code2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, fetchConnections, fetchNetworkStats, fetchNetworkSuggestions, requestConnection, updateConnection } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type Person = any

const idOf = (value: any): string => {
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (typeof value === "object") return String(value._id || value.id || value.$oid || "")
  return ""
}


export default function DiscoveryPage() {
  const { user, token, isLoading } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [connections, setConnections] = useState<Person[]>([])
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [skill, setSkill] = useState("")
  const [location, setLocation] = useState("")
  const [experience, setExperience] = useState("")
  const [tab, setTab] = useState<"discover" | "connections" | "requests">("discover")
  const [stats, setStats] = useState({ connections: 0, pendingRequests: 0, extendedNetwork: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = async () => {
    if (!token) return
    setLoading(true); setError("")
    try {
      const params = { q: searchQuery.trim(), skill: skill.trim(), location: location.trim(), experience }
      const [suggestions, connectionData, statsData] = await Promise.all([
        fetchNetworkSuggestions(params, token),
        fetchConnections(token),
        fetchNetworkStats(token)
      ])
      setPeople(suggestions.suggestions || [])
      setConnections(connectionData.connections || [])
      setStats(statsData)
    } catch (e: any) { setError(e?.message || "Unable to load discovery") }
    finally { setLoading(false) }
  }

  useEffect(() => { if (!isLoading && user) void load() }, [isLoading, user, token, searchQuery, skill, location, experience])

  const relation = (id: string) => connections.find(c => idOf(c.requester) === id || idOf(c.recipient) === id)
  const incoming = connections.filter(c => c.status === "pending" && idOf(c.recipient) === idOf(user?.id))
  const outgoing = connections.filter(c => c.status === "pending" && idOf(c.requester) === idOf(user?.id))
  const accepted = connections.filter(c => c.status === "accepted")

  const connect = async (id: string) => { if (!token) return; setBusy(id); try { await requestConnection(id, token); await load() } catch (e: any) { setError(e?.message || "Unable to send request") } finally { setBusy(null) } }
  const respond = async (id: string, status: "accepted" | "rejected") => { if (!token) return; setBusy(id); try { await updateConnection(id, status, token); await load() } catch (e: any) { setError(e?.message || "Unable to update request") } finally { setBusy(null) } }

  const connectionPeople = useMemo(() => accepted.map(c => {
    const requester = idOf(c.requester) === idOf(user?.id) ? c.recipient : c.requester
    return requester
  }).filter(Boolean), [accepted, user?.id])

  if (isLoading) return <div className="min-h-screen bg-slate-950 grid place-items-center text-slate-300">Loading DevHeaven...</div>
  if (!user) return null

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" /><div className="absolute right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/10 blur-3xl" /></div>
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3"><Link href="/dashboard" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600"><Code2 className="h-5 w-5" /></span><span>Dev<span className="text-cyan-400">Heaven</span></span></Link><div className="hidden flex-1 items-center gap-1 md:flex"><Link href="/dashboard" className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">Home</Link><Link href="/discovery" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white">Discovery</Link><Link href="/projects" className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">Projects</Link><Link href="/jobs" className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">Jobs</Link></div><Link href={`/profile/${user.id}`}><Avatar className="h-9 w-9 border border-cyan-400/40"><AvatarImage src={assetUrl(user.profileImage)} /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar></Link></div></nav>

    <main className="relative mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-violet-600/15 p-7 md:p-9"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300"><Compass className="h-3.5 w-3.5" /> Discover people</div><h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Find your people on DevHeaven.</h1><p className="mt-2 max-w-2xl text-slate-400">Search developers, explore profiles, discover shared skills and connect with people building interesting things.</p></div><div className="grid grid-cols-2 gap-2 text-center md:grid-cols-5"><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xl font-bold">{stats.connections}</p><p className="text-[11px] text-slate-500">Connections</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xl font-bold">{outgoing.length}</p><p className="text-[11px] text-slate-500">Sent</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xl font-bold">{incoming.length}</p><p className="text-[11px] text-slate-500">Received</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xl font-bold">{stats.pendingRequests}</p><p className="text-[11px] text-slate-500">Pending</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xl font-bold">{stats.extendedNetwork}</p><p className="text-[11px] text-slate-500">Extended</p></div></div></div></section>

      <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2"><Button variant="ghost" onClick={() => setTab("discover")} className={tab === "discover" ? "bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/15" : "text-slate-400 hover:bg-white/5 hover:text-white"}><Compass className="mr-2 h-4 w-4" />Discover</Button><Button variant="ghost" onClick={() => setTab("connections")} className={tab === "connections" ? "bg-violet-400/10 text-violet-300 hover:bg-violet-400/15" : "text-slate-400 hover:bg-white/5 hover:text-white"}><UserCheck className="mr-2 h-4 w-4" />My connections</Button><Button variant="ghost" onClick={() => setTab("requests")} className={tab === "requests" ? "bg-amber-400/10 text-amber-300 hover:bg-amber-400/15" : "text-slate-400 hover:bg-white/5 hover:text-white"}><Clock3 className="mr-2 h-4 w-4" />Requests {incoming.length > 0 && <Badge className="ml-2 bg-amber-400 text-slate-950">{incoming.length}</Badge>}</Button></div>

      {tab === "discover" && <>
        <Card className="mt-5 border-white/10 bg-white/[0.04]"><CardContent className="p-5"><form onSubmit={e => { e.preventDefault(); setSearchQuery(query) }} className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400" /><Input className="h-12 border-white/10 bg-slate-950/60 pl-10 pr-4 text-white placeholder:text-slate-500" placeholder="Search people by name, username or skill..." value={query} onChange={e => setQuery(e.target.value)} /></div><Button type="submit" className="h-12 shrink-0 bg-gradient-to-r from-cyan-500 to-violet-600 px-6 text-white"><Search className="mr-2 h-4 w-4" />Search</Button></form><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" /> Refine your discovery</div><div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3"><Input className="border-white/10 bg-slate-950/50 text-white placeholder:text-slate-600" placeholder="Skill e.g. React" value={skill} onChange={e => setSkill(e.target.value)} /><Input className="border-white/10 bg-slate-950/50 text-white placeholder:text-slate-600" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} /><select className="h-10 rounded-md border border-white/10 bg-slate-950/50 px-3 text-sm text-slate-300" value={experience} onChange={e => setExperience(e.target.value)}><option value="">Any experience</option><option value="0">0 years</option><option value="1">1+ years</option><option value="3">3+ years</option><option value="5">5+ years</option><option value="10">10+ years</option></select></div></CardContent></Card>
        {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {loading ? <div className="py-16 text-center text-slate-500">Finding developers for you...</div> : people.length === 0 ? <Card className="mt-5 border-white/10 bg-white/[0.04]"><CardContent className="py-16 text-center"><Users className="mx-auto h-10 w-10 text-slate-600" /><h2 className="mt-3 font-semibold">No developers found</h2><p className="mt-1 text-sm text-slate-500">Try a broader search or update your profile.</p></CardContent></Card> : <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{people.map(person => { const id = idOf(person); const r = relation(id); const pendingFromMe = r?.status === "pending" && idOf(r.requester) === idOf(user.id); return <Card key={id} className="group border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.06]"><CardContent className="p-6"><div className="flex items-start justify-between"><Avatar className="h-16 w-16 border border-white/10"><AvatarImage src={assetUrl(person.profileImage)} /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-white">{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar><div className="flex flex-col items-end gap-1">{person.sharedSkills > 0 && <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300">{person.sharedSkills} shared skill{person.sharedSkills === 1 ? "" : "s"}</Badge>}{person.mutualConnections > 0 && <Badge variant="outline" className="border-white/10 text-slate-400">{person.mutualConnections} mutual</Badge>}</div></div><h3 className="mt-4 text-lg font-bold">{person.firstName} {person.lastName}</h3><p className="text-sm text-cyan-400">@{person.username || "developer"}</p>{person.location && <p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{person.location}</p>}<p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{person.bio || "Developer on DevHeaven"}</p><div className="mt-4 flex flex-wrap gap-1.5">{(person.skills || []).slice(0, 5).map((s: string) => <Badge key={s} variant="outline" className="border-white/10 text-xs text-slate-400">{s}</Badge>)}</div><div className="mt-5 flex gap-2"><Button asChild variant="outline" className="flex-1 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"><Link href={`/profile/${id}`}>View profile</Link></Button>{r?.status === "accepted" ? <Button variant="outline" disabled className="border-emerald-400/20 text-emerald-300"><UserCheck className="mr-1 h-4 w-4" />Connected</Button> : pendingFromMe ? <Button variant="outline" disabled className="border-amber-400/20 text-amber-300"><Clock3 className="mr-1 h-4 w-4" />Pending</Button> : <Button onClick={() => void connect(id)} disabled={busy === id} className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white"><UserPlus className="mr-1 h-4 w-4" />Connect</Button>}</div></CardContent></Card>})}</div>}
      </>}

      {tab === "requests" && <div className="mt-5 space-y-3">{incoming.length === 0 ? <Card className="border-white/10 bg-white/[0.04]"><CardContent className="py-16 text-center text-slate-500">You have no pending connection requests.</CardContent></Card> : incoming.map(c => { const person = c.requester; const id = idOf(c._id || c.id); return <Card key={id} className="border-white/10 bg-white/[0.04]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar className="h-12 w-12"><AvatarImage src={assetUrl(person?.profileImage)} /><AvatarFallback>{person?.firstName?.[0] || "U"}</AvatarFallback></Avatar><div><p className="font-semibold">{person?.firstName} {person?.lastName}</p><p className="text-sm text-slate-500">@{person?.username || "developer"}</p></div></div><div className="flex gap-2"><Button onClick={() => void respond(id, "accepted")} disabled={busy === id} className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white"><Check className="mr-1 h-4 w-4" />Accept</Button><Button variant="outline" onClick={() => void respond(id, "rejected")} disabled={busy === id} className="border-white/10"><X className="mr-1 h-4 w-4" />Decline</Button></div></CardContent></Card>})}</div>}

      {tab === "connections" && <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{connectionPeople.length === 0 ? <Card className="border-white/10 bg-white/[0.04] md:col-span-2 lg:col-span-3"><CardContent className="py-16 text-center text-slate-500">Your connections will appear here.</CardContent></Card> : connectionPeople.map(person => { const id = String(person._id || person.id); return <Card key={id} className="border-white/10 bg-white/[0.04]"><CardContent className="flex items-center justify-between gap-3 p-5"><div className="flex min-w-0 items-center gap-3"><Avatar><AvatarImage src={assetUrl(person.profileImage)} /><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-semibold">{person.firstName} {person.lastName}</p><p className="truncate text-sm text-cyan-400">@{person.username || "developer"}</p></div></div><Button asChild variant="outline" size="sm" className="border-white/10"><Link href={`/profile/${id}`}>Profile</Link></Button></CardContent></Card>})}</div>}
    </main>
  </div>
}
