"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { fetchUserById, assetUrl } from "@/lib/api"
import { formatLocalDateTime } from "@/lib/time"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Code2, MapPin, Calendar, MessageCircle } from "lucide-react"

export default function UserProfilePage() {
  const { user: me } = useAuth()
  const params = useParams<{ userId: string }>()
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!params.userId) return
    fetchUserById(params.userId).then(setUser).catch(err => setError(err.message || "Unable to load profile"))
  }, [params.userId])

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
  return <div className="min-h-screen bg-gray-50">
    <nav className="bg-white border-b"><div className="max-w-4xl mx-auto px-4 py-4"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl"><Code2 className="text-purple-600" />DevHeaven</Link></div></nav>
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Card><CardContent className="pt-8 text-center md:text-left md:flex md:gap-8 md:items-start"><Avatar className="h-32 w-32 mx-auto md:mx-0"><AvatarImage src={assetUrl(user.profileImage)} /><AvatarFallback className="text-3xl">{initials}</AvatarFallback></Avatar><div className="flex-1 mt-5 md:mt-0"><h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1><p className="text-gray-500">@{user.username}</p><p className="mt-4 text-gray-700 whitespace-pre-wrap">{user.bio || "This developer hasn't added a bio yet."}</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">{user.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{user.location}</span>}{user.createdAt && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {formatLocalDateTime(user.createdAt)}</span>}</div><div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">{(user.skills || []).map((skill: string) => <span key={skill} className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">{skill}</span>)}</div><div className="mt-6 flex gap-3 justify-center md:justify-start">{me && me.id !== user._id && <Button asChild><Link href={`/messages?user=${user._id}`}><MessageCircle className="h-4 w-4 mr-2" />Message</Link></Button>}{me?.id === user._id && <Button asChild variant="outline"><Link href="/profile">Edit my profile</Link></Button>}</div></div></CardContent></Card>
    </main>
  </div>
}
