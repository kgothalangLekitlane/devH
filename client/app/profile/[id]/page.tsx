"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"

const PublicProfilePage = dynamic(() => import("./PublicProfilePage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      Loading profile...
    </div>
  ),
})

export default function ProfilePage() {
  const params = useParams<{ id?: string }>()
  const id = typeof params?.id === "string" ? params.id.trim() : ""

  if (!id) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        Profile not found.
      </div>
    )
  }

  return <PublicProfilePage id={id} />
}
