import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

type Prompt = {
  id: string
  type: "reading_passage" | "reading_questions" | "writing_passage" | "writing_questions" | "math_with_calculator" | "math_no_calculator"
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function Admin() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    checkAdmin()
    fetchPrompts()
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate("/")
      return
    }

    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (!adminData) {
      navigate("/")
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      })
    }
  }

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("type")

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch prompts",
      })
      return
    }

    setPrompts(data)
  }

  const startEditing = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setEditContent(prompt.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent("")
  }

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("prompts")
      .update({ content: editContent })
      .eq("id", id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update prompt",
      })
      return
    }

    toast({
      title: "Success",
      description: "Prompt updated successfully",
    })
    
    setEditingId(null)
    setEditContent("")
    fetchPrompts()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Prompt Management</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell className="font-medium">{prompt.type}</TableCell>
                <TableCell>
                  {editingId === prompt.id ? (
                    <div className="space-y-2">
                      <Label htmlFor="content">Edit Content</Label>
                      <Textarea
                        id="content"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto">
                      {prompt.content}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === prompt.id ? (
                    <div className="space-x-2">
                      <Button onClick={() => saveEdit(prompt.id)}>Save</Button>
                      <Button variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => startEditing(prompt)}>Edit</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}