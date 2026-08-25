"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Code2, Github, Mail } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com";

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "", remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setForm((current) => ({ ...current, [id]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    if (!form.identifier.trim() || !form.password) {
      setError("Please enter your username/email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.identifier.trim(), password: form.password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Invalid username/email or password.");
      }

      if (!data.token || !data.user) {
        throw new Error("The server returned an invalid login response.");
      }

      login(data.token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Code2 className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">DevHeaven</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue your developer journey.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Email</Label>
              <Input id="identifier" type="text" autoComplete="username" placeholder="username or john@example.com" value={form.identifier} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} required />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" checked={form.remember} onCheckedChange={(checked) => setForm((current) => ({ ...current, remember: !!checked }))} />
                <Label htmlFor="remember" className="text-sm">Remember me</Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:underline" prefetch={false}>Forgot password?</Link>
            </div>
            {error && <div className="text-red-600 text-sm text-center" role="alert">{error}</div>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" disabled><Github className="h-4 w-4 mr-2" />GitHub</Button>
            <Button variant="outline" type="button" disabled><Mail className="h-4 w-4 mr-2" />Google</Button>
          </div>

          <div className="text-center text-sm">
            Don't have an account? <Link href="/signup" className="text-purple-600 hover:underline" prefetch={false}>Sign up</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
