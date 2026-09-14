"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, Pencil, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { assetUrl, deleteProject, fetchProject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusLabels: Record<string, string> = { planning: "Planning", "in-progress": "In progress", completed: "Completed", maintained: "Maintained" };

type Project = { id: string; title: string; description: string; techStack: string[]; githubUrl?: string; liveUrl?: string; imageUrl?: string; category?: string; status?: string; featured?: boolean; startedAt?: string; completedAt?: string; owner?: { id: string; firstName: string; lastName: string; username: string; profileImage?: string } };

const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value)) : "";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    void fetchProject(params.id).then(body => setProject(body?.project || null)).catch(err => setError(err instanceof Error ? err.message : "Unable to load project.")).finally(() => setLoading(false));
  }, [params?.id]);

  const isOwner = !!user && !!project?.owner?.id && String(user.id) === String(project.owner.id);
  const remove = async () => {
    if (!token || !project || !window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try { await deleteProject(project.id, token); router.push("/projects"); } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete project."); setDeleting(false); }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center text-muted-foreground">Loading project...</main>;
  if (error || !project) return <main className="mx-auto max-w-3xl px-4 py-16"><Card><CardContent className="py-12 text-center"><h1 className="text-xl font-semibold">Project unavailable</h1><p className="mt-2 text-muted-foreground">{error || "This project may have been removed."}</p><Button asChild className="mt-6"><Link href="/projects">Back to projects</Link></Button></CardContent></Card></main>;

  const ownerName = project.owner ? `${project.owner.firstName} ${project.owner.lastName}`.trim() : "DevHeaven member";
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-6 flex items-center justify-between gap-3"><Button variant="ghost" asChild><Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />All projects</Link></Button>{isOwner && <div className="flex gap-2"><Button variant="outline" asChild><Link href={`/projects/${project.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link></Button><Button variant="destructive" onClick={() => void remove()} disabled={deleting}><Trash2 className="mr-2 h-4 w-4" />{deleting ? "Deleting..." : "Delete"}</Button></div>}</div><Card className="overflow-hidden">{project.imageUrl && <img src={assetUrl(project.imageUrl)} alt={`${project.title} cover`} className="max-h-[420px] w-full object-cover" />}{!project.imageUrl && <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/5"><Star className="h-10 w-10 text-primary/60" /></div>}<CardHeader className="space-y-4"><div className="flex flex-wrap items-center gap-2">{project.featured && <Badge><Star className="mr-1 h-3 w-3" />Featured</Badge>}{project.category && <Badge variant="secondary">{project.category}</Badge>}{project.status && <Badge variant="outline">{statusLabels[project.status] || project.status}</Badge>}</div><CardTitle className="text-3xl sm:text-4xl">{project.title}</CardTitle><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(project.owner?.profileImage)} /><AvatarFallback>{ownerName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar><div><p className="font-medium">{ownerName}</p>{project.owner?.username && <p className="text-sm text-muted-foreground">@{project.owner.username}</p>}</div></div></CardHeader><CardContent className="space-y-8"><p className="whitespace-pre-wrap text-base leading-7 text-muted-foreground">{project.description}</p>{(project.startedAt || project.completedAt) && <div><h2 className="mb-2 font-semibold">Timeline</h2><p className="text-sm text-muted-foreground">{formatDate(project.startedAt) || "Start date unknown"}{project.completedAt ? ` → ${formatDate(project.completedAt)}` : " → Present"}</p></div>}<div><h2 className="mb-3 font-semibold">Technologies</h2><div className="flex flex-wrap gap-2">{project.techStack.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}</div></div><div className="flex flex-wrap gap-3 border-t pt-6">{project.liveUrl && <Button asChild><a href={project.liveUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View live project</a></Button>}{project.githubUrl && <Button variant="outline" asChild><a href={project.githubUrl} target="_blank" rel="noreferrer"><Github className="mr-2 h-4 w-4" />View source code</a></Button>}</div></CardContent></Card></div></main>;
}
