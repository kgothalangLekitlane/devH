"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const PublicProfilePage = dynamic(() => import("../profile/[id]/PublicProfilePage"), {
  ssr: false,
})

export default function PublicProfileEntry() {
  const [id, setId] = useState("")

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("profileId")?.trim() || ""
    setId(value)
  }, [])

  if (!id) {
    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center">
        Loading profile...
      </main>
    )
  }

  return <PublicProfilePage id={id} />
}
