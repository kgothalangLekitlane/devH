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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SignUpPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "", password: "", confirmPassword: "", terms: false });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked, files } = e.target;
    if (type === "file") {
      setFile(files?.[0] ?? null);
      return;
    }
    setForm((current) => ({ ...current, [id]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.password || !form.confirmPassword) {
      setError("All required fields must be completed.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.terms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.append("firstName", form.firstName.trim());
      body.append("lastName", form.lastName.trim());
      body.append("email", form.email.trim().toLowerCase());
      body.append("username", form.username.trim());
      body.append("password", form.password);
      if (file) body.append("profile", file);

      const response = await fetch(`${API_URL}/api/auth/register`, { method: "POST", body });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      router.replace("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account. Please try again.");
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
          <CardTitle className="text-2xl">Join DevHeaven</CardTitle>
          <CardDescription>Create your account and start connecting with developers worldwide.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="John" value={form.firstName} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="profile">Profile Image (optional)</Label><Input id="profile" type="file" accept="image/*" onChange={handleChange} />{file && <span className="text-xs text-gray-500">Selected: {file.name}</span>}</div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" placeholder="johndoe" value={form.username} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm Password</Label><Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required /></div>
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={form.terms} onCheckedChange={(checked) => setForm((current) => ({ ...current, terms: !!checked }))} />
              <Label htmlFor="terms" className="text-sm leading-5">I agree to the <Link href="/terms" className="text-purple-600 hover:underline" prefetch={false}>Terms of Service</Link> and <Link href="/privacy" className="text-purple-600 hover:underline" prefetch={false}>Privacy Policy</Link>.</Label>
            </div>
            {error && <div className="text-red-600 text-sm text-center" role="alert">{error}</div>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
          </form>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div></div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" disabled><Github className="h-4 w-4 mr-2" />GitHub</Button>
            <Button variant="outline" type="button" disabled><Mail className="h-4 w-4 mr-2" />Google</Button>
          </div>
          <div className="text-center text-sm">Already have an account? <Link href="/login" className="text-purple-600 hover:underline" prefetch={false}>Sign in</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
