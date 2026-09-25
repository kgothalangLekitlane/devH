"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell, Code2, Compass, Eye, FolderKanban, LogOut, MessageCircle, Plus, RefreshCw, Search, Sparkles, Users, BriefcaseBusiness, ArrowUpRight, Heart, Repeat2, Share2, Shield, ImagePlus, X, Paperclip } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, createPost, fetchConnections, fetchMe, fetchPosts, fetchProjects, getUnreadCount, likePost, repostPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"

type Person = { _id?: string; id?: string; firstName?: string; lastName?: string; username?: string; profileImage?: string }
type MediaItem = { _id?: string; url: string; type: "image" | "video"; mimeType?: string; filename?: string }
type Post = { _id: string; title?: string; content?: string; body?: string; media?: MediaItem[]; author?: Person; user?: Person; likes?: any[]; comments?: any[]; reposts?: any[]; repostOf?: { _id?: string; author?: Person } | null; createdAt?: string }

const idOf = (value: any) => String(value?._id || value?.id || value || "")

export default function DashboardPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [query, setQuery] = useState("")
  const [showComposer, setShowComposer] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "" })
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<{ file: File; url: string }[]>([])
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const [connections, setConnections] = useState(0)
  const [projects, setProjects] = useState(0)
  const [views, setViews] = useState(0)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyPost, setBusyPost] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true); setError("")
    const [postResult, connectionResult, projectResult, meResult] = await Promise.allSettled([
      fetchPosts(), fetchConnections(token), fetchProjects(), fetchMe(token)
    ])
    if (postResult.status === "fulfilled") setPosts(Array.isArray(postResult.value) ? postResult.value : [])
    else setError(postResult.reason instanceof Error ? postResult.reason.message : "Unable to load your feed.")
    if (connectionResult.status === "fulfilled") { const v: any = connectionResult.value; setConnections((v?.connections || v || []).length) }
    if (projectResult.status === "fulfilled") { const v: any = projectResult.value; setProjects((v?.projects || v || []).length) }
    if (meResult.status === "fulfilled") {
      const v: any = meResult.value
      setViews(Number(v?.user?.profileViewCount ?? v?.profileViewCount ?? v?.user?.profileViews ?? v?.profileViews ?? 0))
    }
    try { setUnread(await getUnreadCount(token)) } catch { setUnread(0) }
    setLoading(false)
  }, [token])

  useEffect(() => { if (!authLoading && token) void load(); else if (!authLoading) setLoading(false) }, [authLoading, token, load])

  useEffect(() => {
    const previews = mediaFiles.map(file => ({ file, url: URL.createObjectURL(file) }))
    setMediaPreviews(previews)
    return () => previews.forEach(preview => URL.revokeObjectURL(preview.url))
  }, [mediaFiles])

  const addMedia = (files: FileList | null) => {
    if (!files?.length) return
    const incoming = Array.from(files)
    const allowed = incoming.filter(file => file.type.startsWith("image/") || file.type === "video/mp4" || file.type === "video/webm")
    const oversized = allowed.find(file => file.size > 25 * 1024 * 1024)
    if (oversized) { setError("Each photo or video must be 25 MB or smaller."); return }
    const next = [...mediaFiles, ...allowed].slice(0, 6)
    if (next.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) { setError("Total media size cannot exceed 100 MB."); return }
    setError("")
    setMediaFiles(next)
  }

  const publish = async () => {
    if (!token || (!newPost.title.trim() && !newPost.content.trim() && !mediaFiles.length)) return
    try {
      await createPost({ title: newPost.title.trim() || (mediaFiles.length ? "Media post" : ""), content: newPost.content.trim(), media: mediaFiles }, token)
      setNewPost({ title: "", content: "" }); setMediaFiles([]); setShowComposer(false); await load(); toast({ title: "Post published" })
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to publish post.") }
  }

  const like = async (id: string) => {
    if (!token) return
    setBusyPost(id)
    try {
      const result: any = await likePost(id, token)
      setPosts(current => current.map(p => String(p._id) === String(id) ? { ...p, likes: Array.isArray(result?.likes) ? result.likes : p.likes } : p))
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update like.") }
    finally { setBusyPost(null) }
  }

  const repost = async (id: string) => {
    if (!token) return
    setBusyPost(id)
    try {
      const result: any = await repostPost(id, token)
      const targetId = result?.sourceId || id
      setPosts(current => current.map(p => String(p._id) === String(targetId) ? { ...p, reposts: Array.isArray(result?.reposts) ? result.reposts : p.reposts } : p))
      toast({ title: result?.reposted ? "Post reposted" : "Repost removed" })
      if (result?.reposted) await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to repost this post.") }
    finally { setBusyPost(null) }
  }

  const share = async (post: Post) => {
    const url = `${window.location.origin}/community/${post._id}`
    const shareData = { title: post.title || "DevHeaven post", text: post.content || "Check out this post on DevHeaven", url }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(url); toast({ title: "Post link copied" }) }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        try { await navigator.clipboard.writeText(url); toast({ title: "Post link copied" }) }
        catch { setError("Unable to share this post.") }
      }
    }
  }

  const filtered = posts.filter(post => `${post.title || ""} ${post.content || post.body || ""} ${post.author?.username || post.user?.username || ""}`.toLowerCase().includes(query.toLowerCase()))
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "D"

  if (authLoading || loading) return <div className="min-h-screen bg-background grid place-items-center text-foreground"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/20"><Code2 className="h-5 w-5 text-white" /></span><RefreshCw className="h-4 w-4 animate-spin" />Loading DevHeaven...</div></div>
  if (!token) return <div className="min-h-screen bg-background grid place-items-center p-6"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center text-foreground shadow-2xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600"><Code2 className="text-white" /></div><h1 className="mt-5 text-2xl font-bold">Welcome to DevHeaven</h1><p className="mt-2 text-muted-foreground">Sign in to access your developer workspace.</p><Link href="/login"><Button className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90">Sign in</Button></Link></div></div>

  return <div className="min-h-screen bg-background text-foreground transition-colors">
    <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" /><div className="absolute right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/10 blur-3xl" /></div>
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3"><Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 text-xl font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-600/20"><Code2 className="h-5 w-5 text-white" /></span><span>Dev<span className="text-cyan-400">Heaven</span></span></Link><div className="hidden flex-1 items-center gap-1 md:flex"><Link href="/dashboard" className="rounded-xl bg-muted px-4 py-2 text-sm font-medium text-foreground">Home</Link><Link href="/discovery" className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Discovery</Link><Link href="/discovery" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-500/20 dark:text-cyan-300"><Search className="h-4 w-4" />Search</Link><Link href="/projects" className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Projects</Link><Link href="/jobs" className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Jobs</Link></div><div className="ml-auto flex items-center gap-2"><Link href="/discovery" aria-label="Search people"><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted hover:text-foreground"><Search className="h-5 w-5" /></Button></Link><Link href="/settings" aria-label="Settings"><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted hover:text-foreground"><Shield className="h-5 w-5" /></Button></Link><ThemeToggle /><Link href="/messages"><Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-muted hover:text-foreground"><MessageCircle className="h-5 w-5" /></Button></Link><Link href="/notifications" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}><Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-muted hover:text-foreground"><Bell className="h-5 w-5" />{unread > 0 && <Badge className="absolute -right-1 -top-1 h-5 min-w-5 border-2 border-background bg-cyan-500 px-1 text-[10px] text-slate-950">{unread > 99 ? "99+" : unread}</Badge>}</Button></Link><Link href={`/profile/${user?.id}`}><Avatar className="h-9 w-9 border border-cyan-400/50"><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-white">{initials}</AvatarFallback></Avatar></Link><Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="h-4 w-4" /></Button></div></div></nav>

    <main className="relative mx-auto max-w-7xl px-4 py-7"><section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-cyan-500/15 via-card to-violet-600/15 p-6 shadow-2xl shadow-black/10 md:p-8"><div className="absolute right-[-5rem] top-[-7rem] h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Developer workspace</div><h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Good to see you, {user?.firstName || "Developer"}.</h1><p className="mt-2 max-w-2xl text-muted-foreground">Build your reputation, discover opportunities and connect with people who are building the future.</p></div><Button onClick={() => setShowComposer(true)} className="shrink-0 bg-gradient-to-r from-cyan-500 to-violet-600 font-semibold text-white shadow-lg shadow-violet-600/20 hover:opacity-90"><Plus className="mr-2 h-4 w-4" />Create a post</Button></div></section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Connections</span><span className="rounded-xl bg-cyan-400/10 p-2 text-cyan-500 dark:text-cyan-300"><Users className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-bold">{connections}</p><p className="mt-1 text-xs text-cyan-600 dark:text-cyan-300">Your professional network</p></div><div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Projects</span><span className="rounded-xl bg-violet-400/10 p-2 text-violet-500 dark:text-violet-300"><FolderKanban className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-bold">{projects}</p><p className="mt-1 text-xs text-violet-600 dark:text-violet-300">Things you're building</p></div><div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Profile views</span><span className="rounded-xl bg-amber-400/10 p-2 text-amber-500 dark:text-amber-300"><Eye className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-bold">{views}</p><p className="mt-1 text-xs text-amber-600 dark:text-amber-300">People discovering you</p></div></section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_270px]"><aside className="hidden lg:block"><div className="sticky top-24 space-y-4"><div className="rounded-2xl border border-border bg-card p-4"><Link href={`/profile/${user?.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"><Avatar className="h-11 w-11 border border-border"><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-white">{initials}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-semibold">{user?.firstName} {user?.lastName}</p><p className="truncate text-xs text-muted-foreground">@{user?.username}</p></div></Link><div className="mt-4 grid gap-1"><Link href="/discovery" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Compass className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />Discover developers</Link><Link href="/projects" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><FolderKanban className="h-4 w-4 text-violet-500 dark:text-violet-400" />My projects</Link><Link href="/jobs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><BriefcaseBusiness className="h-4 w-4 text-amber-500 dark:text-amber-400" />Find opportunities</Link><Link href="/notifications" className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><span className="flex items-center gap-3"><Bell className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />Notifications</span>{unread > 0 && <Badge className="h-5 min-w-5 px-1 text-[10px]">{unread > 99 ? "99+" : unread}</Badge>}</Link><Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Shield className="h-4 w-4 text-violet-500 dark:text-violet-400" />Settings</Link></div></div><div className="rounded-2xl border border-border bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4"><Sparkles className="h-5 w-5 text-cyan-500 dark:text-cyan-300" /><p className="mt-3 text-sm font-semibold">Make your profile stand out</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Add your skills, GitHub and a project so recruiters can understand what you build.</p><Link href={`/profile/${user?.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300">Edit profile <ArrowUpRight className="h-3.5 w-3.5" /></Link></div></div></aside>

        <section className="min-w-0 space-y-5"><div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center gap-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your feed..." className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div></div>{error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}{showComposer && <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Create a post</h2><p className="mt-1 text-xs text-muted-foreground">Share text, photos, or videos with the DevHeaven community.</p></div><Button variant="ghost" size="icon" onClick={() => setShowComposer(false)} aria-label="Close post composer"><X className="h-4 w-4" /></Button></div><Input className="mt-4" value={newPost.title} onChange={e => setNewPost(v => ({ ...v, title: e.target.value }))} placeholder="Post title (optional for media posts)" maxLength={160} /><Textarea className="mt-3 min-h-28" value={newPost.content} onChange={e => setNewPost(v => ({ ...v, content: e.target.value }))} placeholder="What are you building or learning?" maxLength={5000} /><input ref={mediaInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={e => { addMedia(e.target.files); e.currentTarget.value = "" }} /><div className="mt-4 flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={() => mediaInputRef.current?.click()}><Paperclip className="mr-2 h-4 w-4" />Add media</Button><span className="text-xs text-muted-foreground">Up to 6 files · 25 MB each · 100 MB total</span></div>{mediaPreviews.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{mediaPreviews.map(({ file, url }, index) => <div key={url} className="relative overflow-hidden rounded-2xl border border-border bg-muted"><div className="relative aspect-square">{file.type.startsWith("video/") ? <video src={url} className="h-full w-full object-cover" controls playsInline /> : <Image src={url} alt={file.name} fill unoptimized sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />}</div><button type="button" onClick={() => setMediaFiles(current => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white" aria-label={"Remove " + file.name}><X className="h-4 w-4" /></button></div>)}</div>}<div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowComposer(false); setMediaFiles([]) }}>Cancel</Button><Button onClick={publish} disabled={!newPost.title.trim() && !newPost.content.trim() && !mediaFiles.length}><ImagePlus className="mr-2 h-4 w-4" />Publish</Button></div></div>}{filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><Code2 className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No posts found</h2><p className="mt-1 text-sm text-muted-foreground">Try another search or create the first post.</p></div> : filtered.map(post => { const author = post.author || post.user; const authorId = idOf(author); const liked = Array.isArray(post.likes) && post.likes.some((entry: any) => idOf(entry) === String(user?.id)); const reposted = Array.isArray(post.reposts) && post.reposts.some((entry: any) => idOf(entry) === String(user?.id)); return <article key={post._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><Avatar className="h-10 w-10"><AvatarImage src={assetUrl(author?.profileImage)} /><AvatarFallback>{`${author?.firstName?.[0] || "D"}${author?.lastName?.[0] || ""}`.toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={authorId ? `/profile/${authorId}` : "#"} className="font-semibold hover:underline">{author?.firstName || author?.lastName ? `${author?.firstName || ""} ${author?.lastName || ""}`.trim() : author?.username || "Developer"}</Link>{author?.username && <span className="text-xs text-muted-foreground">@{author.username}</span>}</div><p className="text-xs text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}</p></div></div><Link href={`/community/${post._id}`} className="mt-4 block"><h2 className="text-lg font-bold hover:text-cyan-500">{post.title || "Media post"}</h2>{(post.content || post.body) && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{post.content || post.body}</p>}{!!post.media?.length && <div className={"mt-4 grid gap-2 " + (post.media.length > 1 ? "grid-cols-2" : "grid-cols-1")}>{post.media.map(media => <div key={String(media._id || media.url)} className="relative overflow-hidden rounded-2xl border border-border bg-muted">{media.type === "video" ? <video src={assetUrl(media.url)} className="max-h-[520px] w-full object-contain" controls playsInline preload="metadata" /> : <div className="relative aspect-video min-h-48"><Image src={assetUrl(media.url)} alt={media.filename || "Post image"} fill unoptimized sizes="(max-width: 768px) 100vw, 700px" className="object-cover" /></div>}</div>)}</div>}</Link>k><div className="mt-4 flex items-center gap-2 border-t border-border pt-3"><Button variant="ghost" size="sm" disabled={busyPost === post._id} onClick={() => like(post._id)} className={liked ? "text-rose-500" : "text-muted-foreground"}><Heart className="mr-1.5 h-4 w-4" fill={liked ? "currentColor" : "none"} />{Array.isArray(post.likes) ? post.likes.length : 0}</Button><Button variant="ghost" size="sm" disabled={busyPost === post._id} onClick={() => repost(post._id)} className={reposted ? "text-cyan-500" : "text-muted-foreground"}><Repeat2 className="mr-1.5 h-4 w-4" />{Array.isArray(post.reposts) ? post.reposts.length : 0}</Button><Link href={`/community/${post._id}`}><Button variant="ghost" size="sm" className="text-muted-foreground"><MessageCircle className="mr-1.5 h-4 w-4" />{Array.isArray(post.comments) ? post.comments.length : 0}</Button></Link><Button variant="ghost" size="sm" onClick={() => void share(post)} className="text-muted-foreground"><Share2 className="mr-1.5 h-4 w-4" />Share</Button></div></article> })}</section>

        <aside className="hidden lg:block"><div className="sticky top-24 space-y-4"><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Quick actions</h2><div className="mt-3 grid gap-2"><Link href="/discovery"><Button className="w-full justify-between bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90">Search people <Search className="h-4 w-4" /></Button></Link><Link href="/jobs"><Button variant="outline" className="w-full justify-between">Explore jobs <ArrowUpRight className="h-4 w-4" /></Button></Link><Link href="/projects"><Button variant="outline" className="w-full justify-between">View projects <ArrowUpRight className="h-4 w-4" /></Button></Link></div></div><div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Your workspace</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep your profile current and share projects regularly to build a stronger developer presence.</p></div></div></aside>
      </div>
    </main>
  </div>
}
