import { redirect } from "next/navigation"

export default async function Page({ params }: { params: { id: string } }) {
  redirect(`/dashboard/games/new?id=${params.id}`)
}


