import dynamic from "next/dynamic"
import type { Metadata } from "next"

const PublicProfilePage = dynamic(() => import("./PublicProfilePage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background text-foreground grid place-items-center">
      Loading profile...
    </div>
  ),
})

export const metadata: Metadata = {
  title: "DevHeaven Profile",
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profileId = String(id || "").trim()

  if (!profileId) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        Profile not found.
      </div>
    )
  }

  return <PublicProfilePage id={profileId} />
}
