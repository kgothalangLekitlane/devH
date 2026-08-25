"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/contexts/AuthContext"
import { fetchMessagesWithUser, fetchUsers, searchCandidates, sendMessage, assetUrl } from "@/lib/api"
import { formatRelativeTime } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Code2, Send, Search } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com"

export default function MessagesPage() {
  const { user: me, token } = useAuth()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")
  const [socketReady, setSocketReady] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchUsers(token)
      .then(list => {
        const filtered = list.filter((u: any) => String(u._id) !== String(me?.id))
        setUsers(filtered)
        const requested = searchParams.get("user")
        setSelected(filtered.find((u: any) => String(u._id) === String(requested)) || filtered[0] || null)
      })
      .catch(err => setError(err.message || "Unable to load users"))
      .finally(() => setLoading(false))
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
        const results = (body.candidates || []).filter((u: any) => String(u._id) !== String(me?.id))
        setUsers(results)
        setSelected(current => current && results.some((u: any) => String(u._id) === String(current._id)) ? current : null)
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

  const conversationTitle = useMemo(() => selected ? `${selected.firstName} ${selected.lastName}` : "Messages", [selected])

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
      const socket = (window as any).__devheavenSocket as Socket | undefined
      if (socket?.connected) socket.emit("sendMessage", { receiverId: selected._id, message: draft, messageId: savedMessage?._id })
    } catch (err: any) {
      setText(draft)
      setError(err.message || "Unable to send message")
    }
  }

  if (!me || !token) return <div className="min-h-screen flex items-center justify-center"><Link href="/login">Sign in to message people</Link></div>

  return <div className="min-h-screen bg-gray-50"><nav className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-4"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl"><Code2 className="text-purple-600" />DevHeaven</Link></div></nav><main className="max-w-6xl mx-auto px-4 py-6"><Card className="h-[calc(100vh-150px)] flex overflow-hidden"><aside className="w-full md:w-80 border-r bg-white overflow-y-auto"><CardHeader><CardTitle>People</CardTitle><p className="text-xs text-gray-500">{socketReady ? "Real-time connected" : "Connecting to real-time..."}</p><div className="relative mt-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name or username..." className="pl-9" /></div>{searching && <p className="text-xs text-gray-500 mt-2">Searching...</p>}</CardHeader><CardContent className="p-2">{loading ? <p className="p-4 text-sm">Loading...</p> : displayedUsers.length === 0 ? <p className="p-4 text-sm text-gray-500">{searchTerm ? "No people found." : "No other users yet."}</p> : displayedUsers.map(person => <button key={person._id} onClick={() => setSelected(person)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${selected?._id === person._id ? "bg-purple-50" : "hover:bg-gray-50"}`}><Avatar><AvatarImage src={assetUrl(person.profileImage)} /><AvatarFallback>{person.firstName?.[0]}{person.lastName?.[0]}</AvatarFallback></Avatar><span><strong className="block">{person.firstName} {person.lastName}</strong><small className="text-gray-500">@{person.username}</small></span></button>)}</CardContent></aside><section className="flex-1 flex flex-col min-w-0">{selected ? <><header className="bg-white border-b p-4"><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(selected.profileImage)} /><AvatarFallback>{selected.firstName?.[0]}{selected.lastName?.[0]}</AvatarFallback></Avatar><div><h2 className="font-semibold">{conversationTitle}</h2><p className="text-xs text-gray-500">@{selected.username}</p></div></div></header><div className="flex-1 overflow-y-auto p-4 space-y-3">{messages.length === 0 ? <p className="text-center text-gray-500 mt-10">No messages yet. Start the conversation.</p> : messages.map((message: any, index) => { const mine = String(message.senderId?._id || message.senderId) === String(me.id); return <div key={message._id || message.messageId || `${message.createdAt}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-purple-600 text-white" : "bg-white border"}`}><p>{message.text || message.message}</p><p className={`text-[11px] mt-1 ${mine ? "text-purple-100" : "text-gray-500"}`}>{formatRelativeTime(message.createdAt || new Date())}</p></div></div> })}</div><div className="bg-white border-t p-3 flex gap-2"><Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={`Message ${selected.firstName}...`} /><Button onClick={send} disabled={!text.trim()}><Send className="h-4 w-4" /></Button></div></> : <div className="flex-1 flex items-center justify-center text-gray-500">Select a person to start messaging.</div>}{error && <p className="p-2 text-sm text-red-600 bg-red-50">{error}</p>}</section></Card></main></div>
}
