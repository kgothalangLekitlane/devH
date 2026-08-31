"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { fetchUserById, assetUrl, fetchConnections, requestConnection, updateConnection, recordProfileView } from "@/lib/api"
import { formatLocalDateTime } from "@/lib/time"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Code2, MapPin, Calendar, MessageCircle, UserPlus, Check, X, Eye } from "lucide-react"

export default function UserProfilePage() {
  const { user: me, token } = useAuth()
  const params = useParams<{ userId: string }>()
  const [user, setUser] = useState<any>(null)
  const [connection, setConnection] = useState<any>(null)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!params.userId) return
    fetchUserById(params.userId).then(setUser).catch(err => setError(err.message || "Unable to load profile"))
  }, [params.userId])

  useEffect(() => {
    if (!token || !params.userId || !me || String(me.id) === String(params.userId)) return
    recordProfileView(String(params.userId), token).catch(() => {})
  }, [token, params.userId, me])

  useEffect(() => {
    if (!token || !user || !me || String(me.id) === String(user._id)) return
    fetchConnections(token)
      .then((body) => {
        const items = body?.connections || []
        const match = items.find((item: any) => {
          const requester = String(item.requester?._id || item.requester)
          const recipient = String(item.recipient?._id || item.recipient)
          return (requester === String(me.id) && recipient === String(user._id)) || (requester === String(user._id) && recipient === String(me.id))
        })
        setConnection(match || null)
      })
      .catch(() => setConnection(null))
  }, [token, user, me])

  const handleRequest = async () => {
    if (!token || !user) return
    setBusy(true); setActionError("")
    try { const body = await requestConnection(String(user._id), token); setConnection(body.connection) }
    catch (err: any) { setActionError(err.message || "Unable to send connection request") }
    finally { setBusy(false) }
  }

  const handleDecision = async (status: "accepted" | "rejected") => {
    if (!token || !connection) return
    setBusy(true); setActionError("")
    try { const body = await updateConnection(String(connection._id), status, token); setConnection(body.connection) }
    catch (err: any) { setActionError(err.message || "Unable to update connection") }
    finally { setBusy(false) }
  }

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
  const isOtherUser = me && String(me.id) !== String(user._id)
  const requesterId = connection ? String(connection.requester?._id || connection.requester) : ""
  const recipientId = connection ? String(connection.recipient?._id || connection.recipient) : ""
  const isIncoming = isOtherUser && requesterId === String(user._id) && recipientId === String(me?.id)
  const isOutgoing = isOtherUser && requesterId === String(me?.id) && recipientId === String(user._id)

  return <div className="min-h-screen bg-gray-50">
    <nav className="bg-white border-b"><div className="max-w-4xl mx-auto px-4 py-4"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl"><Code2 className="text-purple-600" />DevHeaven</Link></div></nav>
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Card><CardContent className="pt-8 text-center md:text-left md:flex md:gap-8 md:items-start"><Avatar className="h-32 w-32 mx-auto md:mx-0"><AvatarImage src={assetUrl(user.profileImage)} /><AvatarFallback className="text-3xl">{initials}</AvatarFallback></Avatar><div className="flex-1 mt-5 md:mt-0"><h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1><p className="text-gray-500">@{user.username}</p><p className="mt-4 text-gray-700 whitespace-pre-wrap">{user.bio || "This developer hasn't added a bio yet."}</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">{user.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{user.location}</span>}{user.createdAt && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {formatLocalDateTime(user.createdAt)}</span>}{typeof user.profileViewCount === "number" && <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{user.profileViewCount} views</span>}</div><div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">{(user.skills || []).filter((skill: string) => skill.trim()).map((skill: string) => <span key={skill} className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">{skill}</span>)}</div>{isOtherUser && <div className="mt-6"><div className="flex gap-3 justify-center md:justify-start flex-wrap">{!connection && <Button onClick={handleRequest} disabled={busy}><UserPlus className="h-4 w-4 mr-2" />{busy ? "Sending..." : "Connect"}</Button>}{connection?.status === "accepted" && <Button variant="secondary" disabled>Connected</Button>}{isOutgoing && connection?.status === "pending" && <Button variant="outline" disabled>Request Sent</Button>}{isIncoming && connection?.status === "pending" && <><Button onClick={() => handleDecision("accepted")} disabled={busy}><Check className="h-4 w-4 mr-2" />Accept</Button><Button onClick={() => handleDecision("rejected")} disabled={busy} variant="outline"><X className="h-4 w-4 mr-2" />Reject</Button></>}{connection?.status === "rejected" && <Button onClick={handleRequest} disabled={busy}><UserPlus className="h-4 w-4 mr-2" />Connect Again</Button>}<Button asChild variant="outline"><Link href={`/messages?user=${user._id}`}><MessageCircle className="h-4 w-4 mr-2" />Message</Link></Button></div>{actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}</div>}{me?.id === user._id && <div className="mt-6 flex gap-3 justify-center md:justify-start"><Button asChild variant="outline"><Link href="/profile">Edit my profile</Link></Button></div>}</div></CardContent></Card>
    </main>
  </div>
}
