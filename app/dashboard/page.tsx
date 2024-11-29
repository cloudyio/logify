
import { auth } from "@/auth"
import { useSession } from "next-auth/react";

export default async function Dashboard() {
    const session = await auth()

    if (!session) return <div>Not authenticated</div>

    if (!session?.user) return null
  return (
    <p>Logged {session.user.name}</p>
  );
}