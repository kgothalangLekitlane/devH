"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, FileText, Loader2, MessageCircle, XCircle } from "lucide-react"
import { fetchApplication } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

const labels: Record<string, string> = { submitted: "Submitted", reviewing: "Reviewing", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Rejected", withdrawn: "Withdrawn" }
const descriptions: Record<string, string> = {
  submitted: "Your application was received successfully.",
  reviewing: "The recruiter is reviewing your application.",
  shortlisted: "You have been shortlisted for the opportunity.",
  accepted: "Your application has been accepted.",
  rejected: "The recruiter has closed your application.",
  withdrawn: "You withdrew this application.",
}
const iconFor: Record<string, typeof FileText> = { submitted: FileText, reviewing: Clock3, shortlisted: BriefcaseBusiness, accepted: CheckCircle2, rejected: XCircle, withdrawn: XCircle }

function formatDate(value?: string) {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function formatDuration(from?: string, to?: string) {
  if (!from || !to) return ""
  const diff = Math.max(0, new Date(to).getTime() - new Date(from).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function ApplicationDetails({ params }: { params: Promise<{ id: string }> }) {
  const { token } = useAuth()
  const [data, setData] = useState<any>()
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    let active = true
    params.then(({ id }) => fetchApplication(id, token).then(result => { if (active) setData(result) }).catch(e => { if (active) setError(e.message) }))
    return () => { active = false }
  }, [token, params])

  const events = useMemo(() => [...(data?.events || [])].sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()), [data?.events])

  if (error) return <main className="mx-auto max-w-3xl p-8"><p className="text-red-600">{error}</p><Link href="/applications" className="mt-4 inline-block text-primary">← Back to applications</Link></main>
  if (!data) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></main>

  const { application } = data
  const job = application.job || {}
  const recruiter = job.recruiter || {}
  const current = application.status
  const latestEvent = events[events.length - 1]
  const recruiterId = recruiter._id || recruiter.id

  return <main className="min-h-screen bg-muted/30 px-4 py-8">
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/applications" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Applications</Link>

      <section className="rounded-xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-3"><BriefcaseBusiness className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight">{job.title || "Application"}</h1><p className="text-muted-foreground">{recruiter.company || recruiter.name || "Company"}{job.location ? ` · ${job.location}` : ""}</p></div>
          </div>
          {recruiterId && <Link href={`/messages?user=${encodeURIComponent(String(recruiterId))}`} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><MessageCircle className="h-4 w-4" />Message recruiter</Link>}
        </div>
        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Current status</p><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{labels[current] || current}</span></div>
          <p className="mt-2 text-sm">{descriptions[current] || "Your application is progressing through the recruitment process."}</p>
          {latestEvent?.createdAt && <p className="mt-1 text-xs text-muted-foreground">Last updated {formatDate(latestEvent.createdAt)}</p>}
        </div>
      </section>

      <section className="rounded-xl border bg-background p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" />Application timeline</h2><p className="mt-1 text-xs text-muted-foreground">Live updates as the recruiter moves your application through the pipeline.</p></div><span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{events.length} {events.length === 1 ? "event" : "events"}</span></div>
        {events.length ? <div className="relative mt-6 ml-2 space-y-7 border-l pl-7">{events.map((event: any, index: number) => {
          const Icon = iconFor[event.status] || Clock3
          const isCurrent = index === events.length - 1
          const next = events[index + 1]
          const duration = formatDuration(event.createdAt, next?.createdAt)
          return <div key={event._id || `${event.status}-${event.createdAt}-${index}`} className="relative">
            <span className="absolute -left-[39px] top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background"><Icon className="h-4 w-4 text-primary" /></span>
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{labels[event.status] || event.status}</p>{isCurrent && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Current</span>}{duration && <span className="text-[11px] text-muted-foreground">{duration} later</span>}</div>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{descriptions[event.status] || "Application status updated."}</p>
            {event.note && <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{event.note}</p>}
          </div>
        })}</div> : <div className="mt-6 rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No timeline events are available yet.</div>}
      </section>

      <section className="rounded-xl border bg-background p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Submitted materials</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{application.coverLetter || "No cover letter submitted."}</p>
        {application.resumeUrl && <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-primary">Open resume →</a>}
      </section>
    </div>
  </main>
}
