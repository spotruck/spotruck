import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagerieClient from "./MessagerieClient";

export default async function MessageriePage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  return <MessagerieClient foodtruckerId={user.id} />;
}
