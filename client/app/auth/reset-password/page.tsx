"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com";
const isStrongPassword = (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
const passwordHint = "Use at least 8 characters with uppercase, lowercase, and a number.";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") || "";
    setToken(value);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    if (!token) return setError("This reset link is missing or invalid.");
    if (!isStrongPassword(password)) return setError(passwordHint);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to reset password.");

      setSuccess(true);
      window.setTimeout(() => {
        window.location.replace("/auth/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">DevHeaven</span>
          </div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Choose a new password for your account. {passwordHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-green-700">Your password has been reset successfully. Redirecting you to sign in…</p>
              <Link href="/auth/login" className="text-sm text-purple-600 hover:underline">Go to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
              </div>
              {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
