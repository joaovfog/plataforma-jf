import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Raiz: decide entre painel e login conforme a sessão. */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/painel" : "/login");
}
