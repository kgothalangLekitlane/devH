"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseBusiness, CheckCircle2, Clock3, FileText, Loader2, XCircle } from "lucide-react"
import { fetchMyApplications, withdrawApplication } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

const labels: Record<string, string> = { submitted: "Submitted", reviewing: "Reviewing", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn" }
const tone: Record<string, string> = { submitted: "bg-slate-100 text-slate-700", reviewing: "bg-blue-100 text-blue-700", shortlisted: "bg-violet-100 text-violet-700", accepted: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700", withdrawn: "bg-amber-100 text-amber-700" }
const pipeline = ["submitted", "reviewing", "shortlisted", "accepted"]

function Progress({ status }: { status: string }) {
  if (status === "rejected" || status === "withdrawn") return <div className="mt-5 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Application closed:</span> {labels[status]}.</div>
  const current = Math.max(0, pipeline.indexOf(status))
  return <div className="mt-5"><div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>Application progress</span><span>{labels[status]}</span></div><div className="flex items-center gap-1">{pipeline.map((step, index) => <div key={step} className="flex min-w-0 flex-1 items-center gap-1"><div className={`h-2 flex-1 rounded-full ${index <= current ? "bg-primary" : "bg-muted"}`} /><span className={`hidden text-[10px] sm:block ${index <= current ? "font-medium text-foreground" : "text-muted-foreground"}`}>{labels[step]}</span></div>)}</div></div>
}

export default function ApplicationsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<any>({ applications: [], stats: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const [withdrawing, setWithdrawing] = useState("")

  const load = async () => {
    if (!token) return
    setLoading(true); setError("")
    try { setData(await fetchMyApplications(token)) } catch (e: any) { setError(e?.message || "Unable to load applications") } finally { setLoading(false) }
  }

  useEffect(() => { if (!authLoading) { if (!token) { setLoading(false); setError("Sign in to view your applications.") } else void load() } }, [token, authLoading])

  const applications = useMemo(() => filter === "all" ? data.applications || [] : (data.applications || []).filter((a: any) => a.status === filter), [data.applications, filter])
  const stats = data.stats || {}

  async function withdraw(id: string) {
    if (!token || !confirm("Withdraw this application?")) return
    setWithdrawing(id); setError("")
    try { await withdrawApplication(id, token); await load() } catch (e: any) { setError(e?.message || "Unable to withdraw application") } finally { setWithdrawing("") }
  }

  if (authLoading || loading) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></main>

  return <main className="min-h-screen bg-muted/30 px-4 py-8 md:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <div><p className="text-sm font-medium text-primary">Career</p><h1 className="text-3xl font-bold tracking-tight">My applications</h1><p className="text-muted-foreground mt-1">Track every opportunity from submission to outcome.</p></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {!token ? <div className="rounded-xl border bg-background p-12 text-center"><BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h3 className="font-semibold">Sign in to track applications</h3><p className="mt-1 text-sm text-muted-foreground">Your application history will appear here after you sign in.</p><Link href="/login" className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign in</Link></div> : <>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-7">{[['total','Total',FileText],['submitted','Submitted',Clock3],['reviewing','Reviewing',Clock3],['shortlisted','Shortlisted',BriefcaseBusiness],['accepted','Accepted',CheckCircle2],['rejected','Rejected',XCircle],['withdrawn','Withdrawn',XCircle]].map(([key,label,Icon]: any) => <button key={key} onClick={() => setFilter(key === 'total' ? 'all' : key)} className={`rounded-xl border bg-background p-4 text-left transition hover:shadow-sm ${filter === (key === 'total' ? 'all' : key) ? 'ring-2 ring-primary/30' : ''}`}><Icon className="mb-2 h-4 w-4 text-muted-foreground" /><p className="text-2xl font-bold">{key === 'total' ? stats.total || 0 : stats[key] || 0}</p><p className="text-xs text-muted-foreground">{label}</p></button>)}</section>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{filter === 'all' ? 'All applications' : labels[filter]}</h2><Link href="/jobs" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Find more jobs</Link></div>
      {applications.length === 0 ? <div className="rounded-xl border bg-background p-12 text-center"><BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h3 className="font-semibold">No applications here yet</h3><p className="mt-1 text-sm text-muted-foreground">Start exploring jobs that match your skills.</p><Link href="/jobs" className="mt-5 inline-block text-sm font-medium text-primary">Browse jobs →</Link></div> : <div className="space-y-3">{applications.map((application: any) => { const job = application.job || {}; const recruiter = job.recruiter || {}; const canWithdraw = !['rejected','accepted','withdrawn'].includes(application.status); const company = recruiter.company || recruiter.name || 'Company'; return <article key={application._id} className="rounded-xl border bg-background p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><Link href={`/jobs/${job._id}`} className="text-lg font-semibold hover:text-primary">{job.title || 'Job opportunity'}</Link><p className="text-sm text-muted-foreground">{company}{job.location ? ` · ${job.location}` : ''}</p><div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone[application.status] || tone.submitted}`}>{labels[application.status] || application.status}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Applied {new Date(application.createdAt).toLocaleDateString()}</span></div></div>{canWithdraw && <button disabled={withdrawing === application._id} onClick={() => withdraw(application._id)} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">{withdrawing === application._id ? 'Withdrawing…' : 'Withdraw'}</button>}</div><Progress status={application.status} /><div className="mt-5 flex flex-wrap gap-3 border-t pt-4"><Link href={`/applications/${application._id}`} className="text-sm font-medium text-primary">View application →</Link>{application.resumeUrl && <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground">View resume</a>}</div></article>})}</div>}
    </>}
  </div></main>
}
