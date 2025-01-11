import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"

export default function AdminAuth() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        // Add user to admin_users table
        const { error } = await supabase
          .from("admin_users")
          .insert([{ user_id: session?.user.id }])
          .select()
          .single()

        if (!error) {
          navigate("/admin")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="container mx-auto max-w-[400px] py-10">
      <h1 className="text-2xl font-bold mb-8">Admin Login</h1>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        redirectTo={`${window.location.origin}/admin`}
      />
    </div>
  )
}