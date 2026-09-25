"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock3, Heart, MessageCircle, Send, Trash2, UserRound, Repeat2, Share2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, likePost, repostPost } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com"

type Person = { _id?: string; id?: string; firstName?: string; lastName?: string; username?: string; profileImage?: string }
type Comment = { _id: string; text: string; user: Person; createdAt?: string }
type MediaItem = { _id?: string; url: string; type: "image" | "video"; mimeType?: string; filename?: string }\ntype Post = { _id: string; title: string; content: string; media?: MediaItem[]; tags?: string[]; likes?: any[]; comments?: Comment[]; reposts?: any[]; repostOf?: { _id?: string; author?: Person } | null; author: Person; createdAt?: string }

const idOf = (value: any) => String(value?._id || value?.id || value || "")
const initials = (person?: Person) => `${person?.firstName?.[0] || ""}${person?.lastName?.[0] || person?.username?.[0] || "D"}`.toUpperCase()
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Recently"

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!params?.id) return
    setLoading(true); setError("")
    try {
      const response = await fetch(`${API_URL}/api/posts/${params.id}`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to load this post")
      setPost(data)
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load this post") }
    finally { setLoading(false) }
  }, [params?.id])

  useEffect(() => { void load() }, [load])

  const liked = useMemo(() => post?.likes?.some(id => idOf(id) === String(user?.id)) || false, [post?.likes, user?.id])
  const reposted = useMemo(() => post?.reposts?.some(id => idOf(id) === String(user?.id)) || false, [post?.reposts, user?.id])
  const ownPost = !!post && idOf(post.author) === String(user?.id)

  const like = async () => {
    if (!token || !post || busy) return
    setBusy(true)
    try {
      const data: any = await likePost(post._id, token)
      if (Array.isArray(data?.likes)) setPost(current => current ? { ...current, likes: data.likes } : current)
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update like") }
    finally { setBusy(false) }
  }

  const repost = async () => {
    if (!token || !post || busy) return
    setBusy(true)
    try {
      const data: any = await repostPost(post._id, token)
      if (Array.isArray(data?.reposts)) setPost(current => current ? { ...current, reposts: data.reposts } : current)
      toast({ title: data?.reposted ? "Post reposted" : "Repost removed" })
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to repost this post") }
    finally { setBusy(false) }
  }

  const share = async () => {
    if (!post) return
    const url = `${window.location.origin}/community/${post._id}`
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.content, url })
      else { await navigator.clipboard.writeText(url); toast({ title: "Post link copied" }) }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        try { await navigator.clipboard.writeText(url); toast({ title: "Post link copied" }) }
        catch { setError("Unable to share this post") }
      }
    }
  }

  const addComment = async () => {
    if (!token || !post || !comment.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: comment.trim() }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to add comment")
      setComment(""); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add comment") }
    finally { setSubmitting(false) }
  }

  const deletePost = async () => {
    if (!token || !post || !ownPost || !window.confirm("Delete this post? This cannot be undone.")) return
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to delete post")
      router.push("/dashboard")
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete post") }
  }

  const deleteComment = async (commentId: string) => {
    if (!token || !post || !window.confirm("Delete this comment?")) return
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comments/${commentId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Unable to delete comment")
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete comment") }
  }

  if (loading) return <main className="min-h-screen bg-background p-6 text-foreground"><div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-10 w-32 rounded bg-muted" /><div className="h-64 rounded-3xl bg-muted" /></div></main>
  if (error && !post) return <main className="min-h-screen bg-background p-6 text-foreground"><div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 text-center"><h1 className="text-xl font-bold">We couldn't load this post</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><div className="mt-5 flex justify-center gap-2"><Button variant="outline" onClick={() => void load()}>Retry</Button><Link href="/dashboard"><Button>Back to feed</Button></Link></div></div></main>
  if (!post) return null

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
    <div className="mb-5 flex items-center justify-between"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to feed</Link>{ownPost && <Button variant="ghost" size="sm" onClick={() => void deletePost()} className="text-red-500 hover:bg-red-500/10 hover:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete post</Button>}</div>
    {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-600 dark:text-red-300">{error}</div>}
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
      <div className="p-6 sm:p-8"><div className="flex items-start gap-3"><Link href={`/profile/${idOf(post.author)}`}><Avatar className="h-12 w-12 border border-border"><AvatarImage src={assetUrl(post.author?.profileImage)} /><AvatarFallback>{initials(post.author)}</AvatarFallback></Avatar></Link><div className="min-w-0 flex-1"><Link href={`/profile/${idOf(post.author)}`} className="font-semibold hover:underline">{post.author?.firstName} {post.author?.lastName}</Link><p className="text-sm text-muted-foreground">@{post.author?.username || "developer"}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{formatDate(post.createdAt)}</p></div></div>
        <h1 className="mt-7 text-2xl font-extrabold tracking-tight sm:text-3xl">{post.title}</h1>{post.content && <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{post.content}</div>}{!!post.media?.length && <div className="mt-6 space-y-4">{post.media.map(media => <div key={String(media._id || media.url)} className="overflow-hidden rounded-2xl border border-border bg-muted">{media.type === "video" ? <video src={assetUrl(media.url)} className="max-h-[720px] w-full" controls playsInline preload="metadata" /> : <div className="relative aspect-video"><Image src={assetUrl(media.url)} alt={media.filename || "Post image"} fill unoptimized sizes="(max-width: 768px) 100vw, 768px" className="object-contain" /></div>}</div>)}</div>}
        {!!post.tags?.length && <div className="mt-5 flex flex-wrap gap-2">{post.tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</div>}
        <div className="mt-7 flex flex-wrap items-center gap-1 border-t border-border pt-4"><Button variant="ghost" size="sm" disabled={busy || !token} onClick={() => void like()} className={liked ? "text-pink-500" : "text-muted-foreground"}><Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />{post.likes?.length || 0} likes</Button><span className="inline-flex items-center px-3 text-sm text-muted-foreground"><MessageCircle className="mr-2 h-4 w-4" />{post.comments?.length || 0} comments</span><Button variant="ghost" size="sm" disabled={busy || !token} onClick={() => void repost()} className={reposted ? "text-emerald-500" : "text-muted-foreground"}><Repeat2 className="mr-2 h-4 w-4" />{reposted ? "Reposted" : "Repost"}{post.reposts?.length ? ` ${post.reposts.length}` : ""}</Button><Button variant="ghost" size="sm" onClick={() => void share()} className="text-muted-foreground"><Share2 className="mr-2 h-4 w-4" />Share</Button></div>
      </div>
    </article>

    <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Discussion</h2><p className="text-sm text-muted-foreground">Share your thoughts with the community.</p></div><Badge variant="secondary">{post.comments?.length || 0}</Badge></div>
      {token ? <div className="mt-5 rounded-2xl border border-border bg-background p-3"><Textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} placeholder="Add a thoughtful comment..." className="min-h-24 resize-none border-0 bg-transparent focus-visible:ring-0" /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">{comment.length}/2000</span><Button onClick={() => void addComment()} disabled={submitting || !comment.trim()} className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white"><Send className="mr-2 h-4 w-4" />{submitting ? "Posting..." : "Comment"}</Button></div></div> : <div className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Sign in to join the discussion.</div>}
      <div className="mt-6 space-y-4">{post.comments?.length ? post.comments.map(item => <div key={item._id} className="rounded-2xl border border-border p-4"><div className="flex items-start gap-3"><Link href={`/profile/${idOf(item.user)}`}><Avatar className="h-9 w-9"><AvatarImage src={assetUrl(item.user?.profileImage)} /><AvatarFallback><UserRound className="h-4 w-4" /></AvatarFallback></Avatar></Link><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><Link href={`/profile/${idOf(item.user)}`} className="font-semibold hover:underline">{item.user?.firstName} {item.user?.lastName}</Link><span className="text-xs text-muted-foreground">@{item.user?.username || "developer"}</span><span className="text-xs text-muted-foreground">· {formatDate(item.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.text}</p></div>{idOf(item.user) === String(user?.id) && <Button variant="ghost" size="icon" onClick={() => void deleteComment(item._id)} aria-label="Delete comment" className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>}</div></div>) : <div className="py-10 text-center"><MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-medium">No comments yet</p><p className="mt-1 text-sm text-muted-foreground">Start the conversation.</p></div>}</div></section>
  </div></main>
}
