import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/integrations/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function AdminAuth() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session)
      
      if (event === "SIGNED_IN" && session) {
        try {
          // Check if user is already an admin
          const { data: existingAdmin, error: queryError } = await supabase
            .from("admin_users")
            .select()
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (queryError) {
            console.error("Error checking admin status:", queryError)
            setError("Failed to verify admin status. Please try again.")
            return
          }

          if (!existingAdmin) {
            console.log("User not found in admin_users, adding now...")
            // Add user to admin_users table if not already an admin
            const { error: insertError } = await supabase
              .from("admin_users")
              .insert([{ user_id: session.user.id }])

            if (insertError) {
              console.error("Error setting admin privileges:", insertError)
              setError("Failed to set admin privileges. Please try again.")
              return
            }
          }
          
          toast({
            title: "Success",
            description: "Successfully signed in as admin",
          })
          
          navigate("/admin")
        } catch (err) {
          console.error("Authentication error:", err)
          setError("An error occurred during authentication. Please try again.")
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, toast])

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