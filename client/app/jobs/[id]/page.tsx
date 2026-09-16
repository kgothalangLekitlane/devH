"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { applyToJob, fetchJob } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type Job = { _id: string; title: string; description?: string; company?: string; location?: string; type?: string; remote?: boolean; skills?: string[]; salaryMin?: number; salaryMax?: number; status?: string; recruiter?: { name?: string; company?: string } };
const money = (value?: number) => value == null ? "" : `R${value.toLocaleString()}`;

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchJob(params.id);
        if (!cancelled) setJob(result?.job || result || null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load this job.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [params?.id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) { router.push(`/login?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`); return; }
    setSubmitting(true); setError("");
    try { await applyToJob(params.id, { coverLetter }, token); router.push("/applications"); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to submit application."); }
    finally { setSubmitting(false); }
  }

  if (loading || authLoading) return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  if (!job) return <main className="mx-auto max-w-4xl px-4 py-12"><p className="text-red-600">{error || "Job not found."}</p><Link href="/jobs" className="mt-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Back to jobs</Link></main>;

  const company = job.company || job.recruiter?.company || job.recruiter?.name || "Company";
  const closed = job.status === "closed";
  return <main className="min-h-screen bg-muted/30 px-4 py-8"><div className="mx-auto max-w-4xl space-y-6">
    <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to jobs</Link>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Card><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-3xl">{job.title}</CardTitle><p className="mt-2 text-muted-foreground">{company}</p></div><BriefcaseBusiness className="h-8 w-8 text-primary" /></div><div className="flex flex-wrap gap-2 pt-3"><Badge variant="secondary"><MapPin className="mr-1 h-3 w-3" />{job.remote ? "Remote" : job.location || "Location flexible"}</Badge>{job.type && <Badge variant="outline">{job.type}</Badge>}{job.salaryMin != null && <Badge variant="outline">{money(job.salaryMin)}{job.salaryMax != null ? ` – ${money(job.salaryMax)}` : "+"}</Badge>}{closed && <Badge variant="destructive">Closed</Badge>}</div></CardHeader><CardContent className="space-y-8"><section><h2 className="mb-3 text-lg font-semibold">About the role</h2><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{job.description || "No description provided."}</p></section>{job.skills?.length > 0 && <section><h2 className="mb-3 text-lg font-semibold">Skills</h2><div className="flex flex-wrap gap-2">{job.skills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}</div></section>}<section className="border-t pt-6"><h2 className="mb-3 text-lg font-semibold">Apply for this position</h2>{closed ? <p className="text-sm text-muted-foreground">Applications are closed for this position.</p> : <form onSubmit={submit} className="space-y-3"><Textarea rows={8} maxLength={5000} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Optional cover letter..." /><Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : token ? "Submit application" : "Sign in to apply"}</Button></form>}</section></CardContent></Card>
  </div></main>;
}
