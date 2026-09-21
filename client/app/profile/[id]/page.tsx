import { connection } from "next/server"
import PublicProfilePage from "./PublicProfilePage"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  return <PublicProfilePage id={id} />
}
