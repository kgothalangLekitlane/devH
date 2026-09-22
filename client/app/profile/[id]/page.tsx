"use client"

import { useParams } from "next/navigation"
import PublicProfilePage from "./PublicProfilePage"

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
