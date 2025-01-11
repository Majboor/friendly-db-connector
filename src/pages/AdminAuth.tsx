import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminAuth() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        try {
          // Check if user is already an admin
          const { data: existingAdmin } = await supabase
            .from("admin_users")
            .select()
            .eq('user_id', session?.user.id)
            .single()

          if (!existingAdmin) {
            // Add user to admin_users table if not already an admin
            const { error: insertError } = await supabase
              .from("admin_users")
              .insert([{ user_id: session?.user.id }])
              .select()
              .single()

            if (insertError) {
              setError("Failed to set admin privileges. Please try again.")
              return
            }
          }
          
          navigate("/admin")
        } catch (err) {
          setError("An error occurred during authentication. Please try again.")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="container mx-auto max-w-[400px] py-10">
      <h1 className="text-2xl font-bold mb-8">Admin Login</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        redirectTo={`${window.location.origin}/admin`}
      />
    </div>
  )
}