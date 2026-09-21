"use client"

import dynamic from "next/dynamic"

const PublicProfilePage = dynamic(() => import("./PublicProfilePage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      Loading profile...
    </div>
  ),
})

export default function PublicProfileClientLoader({ id }: { id: string }) {
  return <PublicProfilePage id={id} />
}
