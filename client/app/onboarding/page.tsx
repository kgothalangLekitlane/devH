"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Check, Code2, Github, Linkedin, MapPin, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateMyProfile } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const steps = ["About you", "Skills & links", "Finish"]

type FormState = { bio: string; location: string; experience: string; skills: string; github: string; linkedin: string; website: string }

export default function OnboardingPage() {
  const { user, token, isLoading, login } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>({ bio: "", location: "", experience: "", skills: "", github: "", linkedin: "", website: "" })

  useEffect(() => {
    if (!user) return
    setForm({ bio: user.bio || "", location: user.location || "", experience: user.experience?.toString() || "", skills: user.skills?.join(", ") || "", github: user.socialLinks?.github || "", linkedin: user.socialLinks?.linkedin || "", website: user.socialLinks?.website || "" })
  }, [user])

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step])

  if (isLoading) return <main className="min-h-screen grid place-items-center">Loading DevHeaven...</main>
  if (!token || !user) return <main className="min-h-screen grid place-items-center p-6"><div className="text-center"><p className="text-muted-foreground">Please sign in first.</p><Link href="/login"><Button className="mt-4">Sign in</Button></Link></div></main>

  const update = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }))

  const validateStep = () => {
    setError("")
    if (step === 0 && !form.bio.trim()) return setError("Add a short introduction so people know what you build or are learning."), false
    if (step === 1 && !form.skills.trim()) return setError("Add at least one skill."), false
    return true
  }

  const saveAndContinue = async () => {
    if (!validateStep()) return
    if (step < steps.length - 1) return setStep(current => current + 1)
    setSaving(true); setError("")
    try {
      const data = new FormData()
      data.append("bio", form.bio.trim())
      data.append("location", form.location.trim())
      data.append("experience", form.experience)
      data.append("skills", form.skills)
      data.append("github", form.github.trim())
      data.append("linkedin", form.linkedin.trim())
      data.append("website", form.website.trim())
      data.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)
      const result = await updateMyProfile(data, token)
      login(token, result.user)
      router.replace("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile. Please try again.")
    } finally { setSaving(false) }
  }

  return <main className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 px-4 py-8 text-white">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex items-center justify-between"><Link href="/dashboard" className="flex items-center gap-2 text-xl font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600"><Code2 className="h-5 w-5" /></span>Dev<span className="text-cyan-300">Heaven</span></Link><span className="text-sm text-white/60">Profile setup</span></header>
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="mb-8"><div className="mb-3 flex items-center justify-between text-xs text-white/60"><span>Step {step + 1} of {steps.length}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${progress}%` }} /></div><h1 className="mt-7 text-3xl font-bold">Let's build your DevHeaven profile.</h1><p className="mt-2 text-white/60">A complete profile helps developers, collaborators and recruiters understand what you can do.</p></div>
        {step === 0 && <div className="space-y-5"><div><Label className="text-white">About you</Label><Textarea className="mt-2 min-h-36 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell us what you build, what you're learning, or the kind of developer you want to become..." maxLength={2000} /><p className="mt-1 text-right text-xs text-white/40">{form.bio.length}/2000</p></div><div><Label className="text-white"><MapPin className="mr-1 inline h-4 w-4" />Location</Label><Input className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.location} onChange={e => update("location", e.target.value)} placeholder="Johannesburg, South Africa" /></div><div><Label className="text-white">Years of experience</Label><Input className="mt-2 border-white/10 bg-white/5 text-white" type="number" min="0" max="80" value={form.experience} onChange={e => update("experience", e.target.value)} placeholder="0" /></div></div>}
        {step === 1 && <div className="space-y-5"><div><Label className="text-white">Skills</Label><Input className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.skills} onChange={e => update("skills", e.target.value)} placeholder="React, Next.js, Node.js, Python, Cybersecurity" /><p className="mt-1 text-xs text-white/40">Separate skills with commas.</p></div><div><Label className="text-white"><Github className="mr-1 inline h-4 w-4" />GitHub</Label><Input className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.github} onChange={e => update("github", e.target.value)} placeholder="https://github.com/username" /></div><div><Label className="text-white"><Linkedin className="mr-1 inline h-4 w-4" />LinkedIn</Label><Input className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.linkedin} onChange={e => update("linkedin", e.target.value)} placeholder="https://linkedin.com/in/username" /></div><div><Label className="text-white">Portfolio / website</Label><Input className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://yourwebsite.com" /></div></div>}
        {step === 2 && <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600"><Sparkles className="h-6 w-6" /></div><div><h2 className="text-xl font-semibold">You're ready to enter DevHeaven.</h2><p className="mt-2 text-sm leading-6 text-white/60">Your profile now has the information needed to start discovering developers, showcasing projects and finding opportunities.</p><ul className="mt-5 space-y-3 text-sm">{["Professional introduction", "Skills and experience", "Developer links"].map(item => <li key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-300"><Check className="h-3 w-3" /></span>{item}</li>)}</ul></div></div></div>}
        {error && <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}
        <div className="mt-8 flex items-center justify-between gap-3"><Button variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => step === 0 ? router.replace("/dashboard") : setStep(current => current - 1)}> {step === 0 ? "Skip for now" : "Back"}</Button><Button onClick={() => void saveAndContinue()} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white">{saving ? "Saving..." : step === steps.length - 1 ? "Enter DevHeaven" : "Continue"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      </section>
    </div>
  </main>
}
