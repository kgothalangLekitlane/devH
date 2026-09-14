"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bell, Check, CheckCheck, MessageCircle, UserPlus, BriefcaseBusiness, Heart, MessageSquare, Settings2, ArrowRight, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { assetUrl, fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Notification = {
  _id: string
  type: string
  text: string
  link?: string
  read: boolean
  createdAt: string
  sender?: { firstName?: string; lastName?: string; username?: string; profileImage?: string }
}

type Filter = "all" | "unread" | "connections" | "applications" | "messages" | "community"

const iconFor = (type: string) => {
  if (type === "connection") return UserPlus
  if (type === "message") return MessageCircle
  if (type === "job_application" || type === "application_status") return BriefcaseBusiness
  if (type === "like") return Heart
  if (type === "comment") return MessageSquare
  return Bell
}

const groupFor = (type: string): Filter => {
  if (type === "connection") return "connections"
  if (type === "message") return "messages"
  if (["job_application", "application_status"].includes(type)) return "applications"
  if (["like", "comment"].includes(type)) return "community"
  return "all"
}

const timeAgo = (value: string) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

export default function NotificationsPage() {
  const { user, token, isLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError("")
    try {
      const body: any = await fetchNotifications(token, 50)
      setNotifications(body?.notifications || body || [])
      setUnreadCount(Number(body?.unreadCount || 0))
    } catch (e: any) {
      setError(e?.message || "Unable to load notifications")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { if (!isLoading && user) void load() }, [isLoading, user, load])

  const visible = useMemo(() => notifications.filter(n => {
    if (filter === "unread") return !n.read
    if (filter === "all") return true
    return groupFor(n.type) === filter
  }), [notifications, filter])

  const markRead = async (notification: Notification) => {
    if (notification.read || !token) return
    setBusy(notification._id)
    try {
      await markNotificationRead(notification._id, token)
      setNotifications(items => items.map(item => item._id === notification._id ? { ...item, read: true } : item))
      setUnreadCount(count => Math.max(0, count - 1))
    } catch (e: any) { setError(e?.message || "Unable to update notification") }
    finally { setBusy(null) }
  }

  const markAll = async () => {
    if (!token || unreadCount === 0) return
    setBusy("all")
    try {
      await markAllNotificationsRead(token)
      setNotifications(items => items.map(item => ({ ...item, read: true })))
      setUnreadCount(0)
    } catch (e: any) { setError(e?.message || "Unable to mark notifications as read") }
    finally { setBusy(null) }
  }

  if (isLoading) return <div className="min-h-screen bg-slate-950 grid place-items-center text-slate-300">Loading DevHeaven...</div>
  if (!user) return null

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Link href="/dashboard" className="text-xl font-extrabold tracking-tight">Dev<span className="text-cyan-400">Heaven</span></Link><div className="flex items-center gap-2"><Button asChild variant="ghost" className="text-slate-400 hover:bg-white/5 hover:text-white"><Link href="/messages"><MessageCircle className="mr-2 h-4 w-4" />Messages</Link></Button><Link href={`/profile/${user.id}`}><Avatar className="h-9 w-9 border border-cyan-400/30"><AvatarImage src={assetUrl(user.profileImage)} /><AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar></Link></div></div></nav>

    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-300"><Bell className="mr-1.5 h-3.5 w-3.5" />Activity center</Badge><h1 className="mt-3 text-3xl font-extrabold tracking-tight">Notifications {unreadCount > 0 && <span className="text-cyan-400">({unreadCount})</span>}</h1><p className="mt-1 text-sm text-slate-500">Stay on top of connections, applications, messages and community activity.</p></div><Button variant="outline" onClick={() => void markAll()} disabled={busy === "all" || unreadCount === 0} className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10">{busy === "all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}Mark all read</Button></div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{(["all", "unread", "connections", "applications", "messages", "community"] as Filter[]).map(item => <Button key={item} variant="ghost" onClick={() => setFilter(item)} className={`shrink-0 capitalize ${filter === item ? "bg-cyan-400/10 text-cyan-300" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}>{item}{item === "unread" && unreadCount > 0 && <span className="ml-2 rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">{unreadCount}</span>}</Button>)}</div>

      {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <Card className="mt-4 overflow-hidden border-white/10 bg-white/[0.035]">
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading activity...</div> : visible.length === 0 ? <div className="py-20 text-center"><Settings2 className="mx-auto h-10 w-10 text-slate-700" /><h2 className="mt-3 font-semibold">Nothing here yet</h2><p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{filter === "unread" ? "You’re all caught up. New activity will appear here." : "Notifications from your DevHeaven activity will appear here."}</p></div> : <div className="divide-y divide-white/5">{visible.map(notification => { const Icon = iconFor(notification.type); const senderName = notification.sender ? `${notification.sender.firstName || ""} ${notification.sender.lastName || ""}`.trim() : "DevHeaven"; const content = notification.sender && notification.text && !notification.text.toLowerCase().includes(senderName.toLowerCase()) ? notification.text : notification.text; const item = <div className={`flex gap-4 p-4 transition-colors hover:bg-white/[0.025] ${!notification.read ? "bg-cyan-400/[0.035]" : ""}`}><div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notification.read ? "bg-white/5 text-slate-500" : "bg-cyan-400/10 text-cyan-300"}`}>{notification.sender ? <Avatar className="h-10 w-10"><AvatarImage src={assetUrl(notification.sender.profileImage)} /><AvatarFallback>{notification.sender.firstName?.[0] || "D"}</AvatarFallback></Avatar> : <Icon className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className={`text-sm leading-6 ${notification.read ? "text-slate-400" : "font-medium text-slate-100"}`}>{content}</p><p className="mt-1 text-xs text-slate-600">{timeAgo(notification.createdAt)}{senderName !== "DevHeaven" && notification.sender?.username ? ` · @${notification.sender.username}` : ""}</p></div>{!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => void markRead(notification)} disabled={busy === notification._id || notification.read} className="h-8 px-2 text-xs text-slate-500 hover:text-white">{busy === notification._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}{notification.read ? "Read" : "Mark read"}</Button>{notification.link && <Button asChild size="sm" className="h-8 bg-white/5 px-2 text-xs text-slate-300 hover:bg-white/10"><Link href={notification.link} onClick={() => void markRead(notification)}><ArrowRight className="mr-1.5 h-3.5 w-3.5" />Open</Link></Button>}</div></div></div>; return <div key={notification._id}>{item}</div>})}</div>}
        </CardContent>
      </Card>
    </main>
  </div>
}
