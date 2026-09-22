"use client"

import { useParams } from "next/navigation"

export default function ProfilePage() {
  const params = useParams<{ id?: string }>()
  const id = typeof params?.id === "string" ? params.id.trim() : ""

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
      <div>
        <h1>Profile route diagnostic</h1>
        <p>{id ? `Profile ID: ${id}` : "Profile ID missing"}</p>
      </div>
    </main>
  )
}
