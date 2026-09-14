"use client";
import { useState } from "react";
import Link from "next/link";
import { Code2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (loading) return; setError(""); setLoading(true); try { const response = await fetch(`${API_URL}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Unable to send reset email."); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : "Unable to send reset email."); } finally { setLoading(false); } };
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4"><Card className="w-full max-w-md bg-white/95"><CardHeader className="text-center"><div className="flex items-center justify-center gap-2 mb-4"><Code2 className="h-8 w-8 text-purple-600" /><span className="text-2xl font-bold text-gray-900">DevHeaven</span></div><CardTitle>Forgot your password?</CardTitle><CardDescription>Enter your email and we&apos;ll send you a secure reset link.</CardDescription></CardHeader><CardContent>{sent ? <div className="space-y-4 text-center"><p className="text-sm text-gray-700">If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.</p><Link href="/auth/login"><Button className="w-full bg-purple-600 hover:bg-purple-700">Back to sign in</Button></Link></div> : <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>{error && <div className="text-red-600 text-sm" role="alert">{error}</div>}<Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button><Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:underline"><ArrowLeft className="h-4 w-4" />Back to sign in</Link></form>}</CardContent></Card></div>;
}
