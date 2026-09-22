"use client"

import { useParams } from "next/navigation"
import PublicProfilePage from "@/app/profile/[id]/PublicProfilePage"

export default function PublicProfileRoute() {
  const params = useParams<{ id?: string }>()
  const id = typeof params?.id === "string" ? params.id.trim() : ""

  if (!id) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center">
        Profile not found.
      </main>
    )
  }

  return <PublicProfilePage id={id} />
}
