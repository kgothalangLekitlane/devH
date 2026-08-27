"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/contexts/AuthContext"
import { fetchMessagesWithUser, fetchUsers, searchCandidates, sendMessage, assetUrl, fetchConnections, requestConnection, updateConnection } from "@/lib/api"
import { formatRelativeTime } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Code2, Send, Search, UserPlus, Check, X } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com"

type UserSummary = {
  _id: string
  firstName?: string
  lastName?: string
  username?: string
  profileImage?: string
}

type ConnectionRecord = {
  _id?: string
  requester?: any
  recipient?: any
  status?: string
}

const idOf = (value: any) => String(value?._id || value?.id || value || "")

export default function MessagesPage() {
  const { user: me, token } = useAuth()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [selected, setSelected] = useState<UserSummary | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [text, setText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [error, setError] = useState("")
  const [socketReady, setSocketReady] = useState(false)

  const loadConnections = async () => {
    if (!token) return
    try {
      const body = await fetchConnections(token)
      setConnections(Array.isArray(body) ? body : (body?.connections || []))
    } catch (err: any) {
      setError(err.message || "Unable to load connections")
    }
  }

  useEffect(() => {
    if (!token) return
    fetchUsers(token)
      .then(list => {
        const filtered: UserSummary[] = list.filter((u: UserSummary) => String(u._id) !== String(me?.id))
        setUsers(filtered)
        const requested = searchParams.get("user")
        setSelected(filtered.find(u => String(u._id) === String(requested)) || filtered[0] || null)
      })
      .catch(err => setError(err.message || "Unable to load users"))
      .finally(() => setLoading(false))
    void loadConnections()
  }, [token, me?.id, searchParams])

  useEffect(() => {
    if (!token) return
    const term = searchTerm.trim()
    if (!term) return

    const timer = window.setTimeout(async () => {
      setSearching(true)
      setError("")
      try {
        const body = await searchCandidates(term, token)
        const results: UserSummary[] = (body.candidates || []).filter((u: UserSummary) => String(u._id) !== String(me?.id))
        setUsers(results)
        setSelected((current: UserSummary | null) =>
          current && results.some((u: UserSummary) => String(u._id) === String(current._id)) ? current : null
        )
      } catch (err: any) {
        setError(err.message || "Unable to search people")
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchTerm, token, me?.id])

  const displayedUsers = useMemo(() => users, [users])

  useEffect(() => {
    if (!token || !selected) return
    setError("")
    fetchMessagesWithUser(selected._id, token)
      .then(body => setMessages(body.messages || []))
      .catch(err => setError(err.message || "Unable to load conversation"))
  }, [token, selected?._id])

  useEffect(() => {
    if (!token) return

    const socket: Socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    })

    ;(window as any).__devheavenSocket = socket

    socket.on("connect", () => {
      setSocketReady(true)
      if (selected?._id) socket.emit("joinConversation", { userId: selected._id })
    })
    socket.on("connect_error", err => {
      setSocketReady(false)
      console.error("DevHeaven messaging connection failed:", err.message)
    })
    socket.on("disconnect", () => setSocketReady(false))
    socket.on("receiveMessage", (incoming: any) => {
      if (!selected) return
      const relevant =
        (String(incoming.senderId?._id || incoming.senderId) === String(selected._id) && String(incoming.receiverId?._id || incoming.receiverId) === String(me?.id)) ||
        (String(incoming.senderId?._id || incoming.senderId) === String(me?.id) && String(incoming.receiverId?._id || incoming.receiverId) === String(selected._id))
      if (!relevant) return
      setMessages(prev => {
        const incomingId = incoming._id || incoming.messageId
        if (incomingId && prev.some(message => String(message._id || message.messageId) === String(incomingId))) return prev
        return [...prev, incoming]
      })
    })

    return () => {
      socket.disconnect()
      delete (window as any).__devheavenSocket
      setSocketReady(false)
    }
  }, [token, selected?._id, me?.id])

  const selectedConnection = useMemo(() => {
    if (!selected || !me?.id) return null
    return connections.find(connection => {
      const requesterId = idOf(connection.requester)
      const recipientId = idOf(connection.recipient)
      return (requesterId === String(me.id) && recipientId === String(selected._id)) ||
        (requesterId === String(selected._id) && recipientId === String(me.id))
    }) || null
  }, [connections, selected, me?.id])

  const connectionState = useMemo(() => {
    if (!selectedConnection) return "none"
    if (selectedConnection.status === "accepted") return "accepted"
    if (selectedConnection.status === "rejected") return "rejected"
    if (selectedConnection.status === "pending") {
      return idOf(selectedConnection.recipient) === String(me?.id) ? "incoming" : "outgoing"
    }
    return "none"
  }, [selectedConnection, me?.id])

  const handleConnect = async () => {
    if (!token || !selected || connectionLoading) return
    setConnectionLoading(true)
    setError("")
    try {
      await requestConnection(selected._id, token)
      await loadConnections()
    } catch (err: any) {
      setError(err.message || "Unable to send connection request")
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleConnectionDecision = async (status: "accepted" | "rejected") => {
    if (!token || !selectedConnection?._id || connectionLoading) return
    setConnectionLoading(true)
    setError("")
    try {
      await updateConnection(selectedConnection._id, status, token)
      await loadConnections()
    } catch (err: any) {
      setError(err.message || `Unable to ${status === "accepted" ? "accept" : "reject"} connection request`)
    } finally {
      setConnectionLoading(false)
    }
  }

  const conversationTitle = useMemo(() => selected ? `${selected.firstName || ""} ${selected.lastName || ""}`.trim() || selected.username || "Messages" : "Messages", [selected])

  const send = async () => {
    if (!token || !selected || !text.trim()) return
    const draft = text.trim()
    setText("")
    setError("")
    try {
      const result = await sendMessage({ receiverId: selected._id, text: draft }, token)
      const savedMessage = result.chat
      if (savedMessage) {
        setMessages(prev => {
          const id = savedMessage._id
          if (id && prev.some(message => String(message._id || message.messageId) === String(id))) return prev
          return [...prev, savedMessage]
        })
      }
    } catch (err: any) {
      setText(draft)
      setError(err.message || "Unable to send message")
    }
  }

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold"><Code2 className="h-6 w-6" />DevHeaven</Link>
          <span className="text-sm text-muted-foreground">{socketReady ? "Connected" : "Connecting…"}</span>
        </header>
        {error && <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</div>}
        <div className="grid gap-4 md:grid-cols-[300px_1fr]">
          <Card>
            <CardHeader><CardTitle>People</CardTitle><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search people…" className="pl-9" /></div></CardHeader>
            <CardContent className="space-y-2">
              {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
              {!searching && !loading && displayedUsers.length === 0 && <p className="text-sm text-muted-foreground">No people found.</p>}
              {displayedUsers.map(user => (
                <button key={user._id} onClick={() => setSelected(user)} className={`flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted ${selected?._id === user._id ? "bg-muted" : ""}`}>
                  <Avatar><AvatarImage src={assetUrl(user.profileImage)} /><AvatarFallback>{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "U"}</AvatarFallback></Avatar>
                  <span className="min-w-0"><span className="block truncate font-medium">{`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}</span><span className="block truncate text-xs text-muted-foreground">@{user.username || "user"}</span></span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="flex min-h-[600px] flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{conversationTitle}</CardTitle>
                {selected && (
                  <div className="flex items-center gap-2">
                    {connectionState === "none" && <Button size="sm" onClick={() => void handleConnect()} disabled={connectionLoading}><UserPlus className="mr-2 h-4 w-4" />{connectionLoading ? "Sending…" : "Connect"}</Button>}
                    {connectionState === "outgoing" && <Button size="sm" variant="secondary" disabled>Request Sent</Button>}
                    {connectionState === "incoming" && <><Button size="sm" onClick={() => void handleConnectionDecision("accepted")} disabled={connectionLoading}><Check className="mr-2 h-4 w-4" />Accept</Button><Button size="sm" variant="outline" onClick={() => void handleConnectionDecision("rejected")} disabled={connectionLoading}><X className="mr-2 h-4 w-4" />Reject</Button></>}
                    {connectionState === "accepted" && <Button size="sm" variant="secondary" disabled>Connected</Button>}
                    {connectionState === "rejected" && <Button size="sm" onClick={() => void handleConnect()} disabled={connectionLoading}><UserPlus className="mr-2 h-4 w-4" />Connect Again</Button>}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto pb-4">{messages.map((message, index) => <div key={String(message._id || message.messageId || index)} className="rounded-lg bg-muted p-3 text-sm">{message.text}</div>)}</div>
              <div className="flex gap-2"><Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void send() }} placeholder={selected ? "Write a message…" : "Select someone to chat"} disabled={!selected} /><Button onClick={() => void send()} disabled={!selected || !text.trim()}><Send className="h-4 w-4" /></Button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
