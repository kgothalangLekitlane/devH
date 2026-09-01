"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clock3, FileText, Loader2 } from "lucide-react"
import { fetchApplication } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

const labels: Record<string,string> = { submitted:"Submitted", reviewing:"Reviewing", shortlisted:"Shortlisted", accepted:"Accepted", rejected:"Rejected", withdrawn:"Withdrawn" }
const steps = ["submitted", "reviewing", "shortlisted", "accepted"]

export default function ApplicationDetails({ params }: { params: { id: string } }) {
  const { token } = useAuth(); const [data,setData] = useState<any>(); const [error,setError] = useState("")
  useEffect(() => { if(token) fetchApplication(params.id, token).then(setData).catch(e=>setError(e.message)) }, [token, params.id])
  if(error) return <main className="mx-auto max-w-3xl p-8"><p className="text-red-600">{error}</p><Link href="/applications" className="mt-4 inline-block text-primary">← Back to applications</Link></main>
  if(!data) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></main>
  const { application, events=[] } = data; const job=application.job||{}; const recruiter=job.recruiter||{}; const current=application.status
  return <main className="min-h-screen bg-muted/30 px-4 py-8"><div className="mx-auto max-w-3xl space-y-5"><Link href="/applications" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>Applications</Link><section className="rounded-xl border bg-background p-6"><div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-3"><BriefcaseIcon /></div><div><h1 className="text-2xl font-bold">{job.title || "Application"}</h1><p className="text-muted-foreground">{recruiter.company || recruiter.name || "Company"}{job.location ? ` · ${job.location}` : ""}</p></div></div><div className="mt-6 rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Current status</p><p className="mt-1 font-semibold">{labels[current] || current}</p></div></section><section className="rounded-xl border bg-background p-6"><h2 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4"/>Application timeline</h2><div className="mt-5 space-y-5">{events.map((event:any)=><div key={event._id} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-primary"/><div><p className="font-medium">{labels[event.status] || event.status}</p><p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>{event.note&&<p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}</div></div>)}</div></section><section className="rounded-xl border bg-background p-6"><h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4"/>Submitted materials</h2><p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{application.coverLetter || "No cover letter submitted."}</p>{application.resumeUrl&&<a href={application.resumeUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-primary">Open resume →</a>}</section></div></main>
}
function BriefcaseIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>}
