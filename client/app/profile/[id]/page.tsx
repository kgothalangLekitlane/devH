"use client"

import { useParams } from "next/navigation"
import PublicProfileClientLoader from "./PublicProfileClientLoader"

export default function ProfilePage() {
  const params = useParams<{ id?: string }>()
  const id = typeof params?.id === "string" ? params.id.trim() : ""

  if (!id) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center">
        Profile not found.
      </main>
    )
  }

  return <PublicProfileClientLoader id={id} />
}
