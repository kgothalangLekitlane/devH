"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Check, Code2, LogOut, Moon, Save, Shield, Sun, UserRound } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { fetchNotificationPreferences, updateMyProfile, updateNotificationPreferences } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { user, token, logout } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", location: "", bio: "", timezone: "" })
  const [preferences, setPreferences] = useState({ profileVisible: true, jobAlerts: true, messageAlerts: true })
  const [messageEmailNotifications, setMessageEmailNotifications] = useState(true)
  const [notificationSaving, setNotificationSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({ firstName: user.firstName || "", lastName: user.lastName || "", headline: user.headline || "", location: user.location || "", bio: user.bio || "", timezone: user.timezone || "" })
  }, [user])

  useEffect(() => {
    if (!token) return
    fetchNotificationPreferences(token).then(data => setMessageEmailNotifications(data?.emailNotifications?.messages !== false)).catch(() => {})
  }, [token])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("devheaven-settings")
      if (stored) setPreferences(current => ({ ...current, ...JSON.parse(stored) }))
    } catch {}
  }, [])

  const updateMessageEmailNotifications = async () => {
    if (!token || notificationSaving) return
    const next = !messageEmailNotifications
    setMessageEmailNotifications(next)
    setNotificationSaving(true)
    try {
      await updateNotificationPreferences(next, token)
      toast({ title: next ? "Email notifications enabled" : "Email notifications disabled", description: next ? "You will receive an email when someone sends you a new message." : "New message emails are now turned off." })
    } catch (error) {
      setMessageEmailNotifications(!next)
      toast({ title: "Unable to update notification preference", description: error instanceof Error ? error.message : "Please try again." })
    } finally { setNotificationSaving(false) }
  }

  const updatePreference = (key: keyof typeof preferences) => {
    setPreferences(current => {
      const next = { ...current, [key]: !current[key] }
      localStorage.setItem("devheaven-settings", JSON.stringify(next))
      return next
    })
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    setSaving(true); setSaved(false)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => data.append(key, value))
      await updateMyProfile(data, token)
      setSaved(true)
      toast({ title: "Settings saved", description: "Your profile information has been updated." })
    } catch (error) {
      toast({ title: "Unable to save", description: error instanceof Error ? error.message : "Please try again." })
    } finally { setSaving(false) }
  }

  return <main className="min-h-screen bg-background text-foreground">
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600"><Code2 className="h-5 w-5 text-white" /></span>Dev<span className="text-cyan-400">Heaven</span></Link>
        <div className="flex items-center gap-2"><ThemeToggle /><Link href="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button></Link></div>
      </div>
    </nav>

    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8"><p className="text-sm font-semibold text-cyan-500">Account control centre</p><h1 className="mt-1 text-3xl font-extrabold">Settings</h1><p className="mt-2 text-muted-foreground">Manage your profile, notifications, privacy and appearance.</p></div>
      <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="space-y-1 lg:sticky lg:top-24 lg:self-start"><a href="#account" className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2.5 text-sm font-medium"><UserRound className="h-4 w-4" />Account</a><a href="#privacy" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Shield className="h-4 w-4" />Privacy</a><a href="#notifications" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Bell className="h-4 w-4" />Notifications</a><a href="#appearance" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Moon className="h-4 w-4" />Appearance</a><a href="#security" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Shield className="h-4 w-4" />Security</a></aside>

        <div className="space-y-6">
          <form id="account" onSubmit={save} className="rounded-3xl border border-border bg-card p-6 shadow-sm"><div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Account & profile</h2><p className="mt-1 text-sm text-muted-foreground">Keep the information recruiters and developers see up to date.</p></div><Button type="submit" disabled={saving}>{saving ? "Saving..." : saved ? <><Check className="mr-2 h-4 w-4" />Saved</> : <><Save className="mr-2 h-4 w-4" />Save changes</>}</Button></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>First name</Label><Input className="mt-2" value={form.firstName} onChange={e => setForm(v => ({ ...v, firstName: e.target.value }))} /></div><div><Label>Last name</Label><Input className="mt-2" value={form.lastName} onChange={e => setForm(v => ({ ...v, lastName: e.target.value }))} /></div><div><Label>Headline</Label><Input className="mt-2" placeholder="e.g. Full-stack developer" value={form.headline} onChange={e => setForm(v => ({ ...v, headline: e.target.value }))} /></div><div><Label>Location</Label><Input className="mt-2" placeholder="City, country" value={form.location} onChange={e => setForm(v => ({ ...v, location: e.target.value }))} /></div><div><Label>Timezone</Label><Input className="mt-2" placeholder="e.g. Africa/Johannesburg" value={form.timezone} onChange={e => setForm(v => ({ ...v, timezone: e.target.value }))} /></div><div><Label>Email</Label><Input className="mt-2" value={user?.email || ""} disabled /></div></div><div className="mt-4"><Label>Bio</Label><Textarea className="mt-2 min-h-32" value={form.bio} onChange={e => setForm(v => ({ ...v, bio: e.target.value }))} /></div></form>

          <section id="privacy" className="rounded-3xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Privacy</h2><p className="mt-1 text-sm text-muted-foreground">Control how discoverable your account is.</p><div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-border p-4"><div><p className="font-medium">Profile visibility</p><p className="text-sm text-muted-foreground">Keep your profile visible in developer discovery.</p></div><button type="button" aria-pressed={preferences.profileVisible} onClick={() => updatePreference("profileVisible")} className={`relative h-6 w-11 rounded-full transition ${preferences.profileVisible ? "bg-cyan-500" : "bg-muted"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${preferences.profileVisible ? "left-6" : "left-1"}`} /></button></div></section>

          <section id="notifications" className="rounded-3xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Choose which alerts you want to receive in this browser.</p><div className="mt-5 space-y-3">{([ ["jobAlerts", "Job alerts", "Get reminders about relevant opportunities."], ["messageAlerts", "Message alerts", "Keep track of new conversations and connection activity."] ] as const).map(([key, title, description]) => <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"><div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div><button type="button" aria-pressed={preferences[key]} onClick={() => updatePreference(key)} className={`relative h-6 w-11 rounded-full transition ${preferences[key] ? "bg-cyan-500" : "bg-muted"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${preferences[key] ? "left-6" : "left-1"}`} /></button></div>)}</div></section>

          <section id="appearance" className="rounded-3xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">Choose the interface theme for your DevHeaven workspace.</p><div className="mt-5 flex items-center justify-between rounded-2xl border border-border p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><Sun className="h-5 w-5" /></span><div><p className="font-medium">Theme</p><p className="text-sm text-muted-foreground">Use the theme control in the navigation to switch modes.</p></div></div><ThemeToggle /></div></section>

          <section id="security" className="rounded-3xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Security & sessions</h2><p className="mt-1 text-sm text-muted-foreground">Your current DevHeaven session is active in this browser.</p><div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4"><p className="font-medium">Signed in as {user?.email || "your account"}</p><p className="mt-1 text-sm text-muted-foreground">For security, sign out when using a shared computer.</p></div><Button variant="outline" className="mt-4" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></section>
        </div>
      </div>
    </div>
  </main>
}
