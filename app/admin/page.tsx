"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { PlusCircle, Trash2, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StaffEmail {
  id: string
  email: string
  created_at: string
}

export default function AdminPanel() {
  const [staffEmails, setStaffEmails] = useState<StaffEmail[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // In a real app, this would be server-side authenticated
  const ADMIN_PASSWORD = "waterbar2025" // This is just for demo; real auth would use proper auth

  useEffect(() => {
    // Check if admin was previously authenticated in this session
    const savedAuth = sessionStorage.getItem("adminAuthenticated")
    if (savedAuth === "true") {
      setIsAuthenticated(true)
      loadStaffEmails()
    }
  }, [])

  const authenticate = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("adminAuthenticated", "true")
      loadStaffEmails()
    } else {
      toast({
        title: "Authentication Failed",
        description: "Incorrect admin password",
        variant: "destructive",
      })
    }
  }

  const loadStaffEmails = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would query a staff_emails table
      // For now, we'll simulate with a query to staff emails in user_auth
      const { data, error } = await supabase
        .from("user_auth")
        .select("id, email, created_at")
        .or("email.ilike.%.waterbar.admin.com,email.eq.admin@thewaterbar.ae,email.eq.staff@thewaterbar.ae")
      
      if (error) throw error
      
      setStaffEmails(data || [])
    } catch (error) {
      console.error("Error loading staff emails:", error)
      toast({
        title: "Error",
        description: "Failed to load staff emails",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addStaffEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // In a real app, this would add to a staff_emails table
      // For this demo, we'll just add a user_auth entry with a placeholder password
      const { data, error } = await supabase
        .from("user_auth")
        .insert([
          {
            email: newEmail,
            password_hash: "placeholder_require_reset", // In reality, you'd use a secure process
          }
        ])
        .select()
      
      if (error) throw error
      
      // Refresh the list
      loadStaffEmails()
      setNewEmail("")
      
      toast({
        title: "Staff Email Added",
        description: `${newEmail} has been added to staff list`,
      })
    } catch (error) {
      console.error("Error adding staff email:", error)
      toast({
        title: "Error",
        description: "Failed to add staff email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeStaffEmail = async (id: string, email: string) => {
    setIsLoading(true)
    try {
      // In a real app, this would remove from a staff_emails table
      const { error } = await supabase
        .from("user_auth")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      
      // Update the list
      setStaffEmails(staffEmails.filter(item => item.id !== id))
      
      toast({
        title: "Staff Email Removed",
        description: `${email} has been removed from staff list`,
      })
    } catch (error) {
      console.error("Error removing staff email:", error)
      toast({
        title: "Error",
        description: "Failed to remove staff email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <Card className="w-[400px] border-purple-400/20 bg-slate-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-white flex justify-center items-center gap-2">
              <Lock className="h-5 w-5 text-purple-400" />
              Admin Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="border-purple-400/30 bg-slate-800/50"
                />
              </div>
              <Button 
                onClick={authenticate} 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!adminPassword}
              >
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="p-6 flex justify-between items-center border-b border-purple-400/20">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-purple-400" />
          <h1 className="text-xl font-semibold text-white">The Water Bar Admin</h1>
        </div>
        <Tabs defaultValue="staff">
          <TabsList className="bg-slate-800/50 border border-purple-400/20">
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="container mx-auto p-6">
        <Card className="border-purple-400/20 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-400" />
              Staff Email Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Add new staff email */}
              <div className="flex gap-2">
                <Input
                  placeholder="New staff email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="border-purple-400/30 bg-slate-800/50"
                />
                <Button 
                  onClick={addStaffEmail} 
                  disabled={isLoading || !newEmail}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Staff emails list */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium opacity-70">Current Staff Emails</h3>
                {staffEmails.length === 0 ? (
                  <div className="text-center py-6 opacity-50">
                    {isLoading ? "Loading..." : "No staff emails configured"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffEmails.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-md bg-slate-800/30 border border-purple-400/20"
                      >
                        <div>
                          <div className="font-medium">{item.email}</div>
                          <div className="text-xs opacity-50">
                            Added on {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStaffEmail(item.id, item.email)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs opacity-50 pt-4 border-t border-purple-400/10">
                <p>Staff emails automatically have access to the staff dashboard.</p>
                <p>For security reasons, use company email addresses when possible.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
