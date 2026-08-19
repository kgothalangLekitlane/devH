import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2, Users, MessageSquare, Briefcase, BookOpen, Rocket, Github, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">DevHeaven</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-purple-300">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Join DevHeaven</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DevHeaven</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The ultimate social platform for software developers. Connect, collaborate, showcase your projects, and accelerate your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-3 text-lg bg-transparent">
                Sign In to Explore
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Everything You Need to Thrive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><Users className="h-12 w-12 text-purple-400 mb-4" /><CardTitle className="text-white">Build Community</CardTitle><CardDescription className="text-gray-300">Connect with developers worldwide, join discussions, and build lasting professional relationships.</CardDescription></CardHeader></Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><Code2 className="h-12 w-12 text-blue-400 mb-4" /><CardTitle className="text-white">Showcase Projects</CardTitle><CardDescription className="text-gray-300">Display your best work, get feedback from peers, and attract potential employers.</CardDescription></CardHeader></Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><MessageSquare className="h-12 w-12 text-green-400 mb-4" /><CardTitle className="text-white">Private Messaging</CardTitle><CardDescription className="text-gray-300">Collaborate privately, discuss opportunities, and network with industry professionals.</CardDescription></CardHeader></Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><Briefcase className="h-12 w-12 text-yellow-400 mb-4" /><CardTitle className="text-white">Career Opportunities</CardTitle><CardDescription className="text-gray-300">Get discovered by recruiters and find your dream job with our integrated career platform.</CardDescription></CardHeader></Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><BookOpen className="h-12 w-12 text-red-400 mb-4" /><CardTitle className="text-white">Learning Resources</CardTitle><CardDescription className="text-gray-300">Access curated tutorials, tools, and resources to continuously improve your skills.</CardDescription></CardHeader></Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm"><CardHeader><Rocket className="h-12 w-12 text-pink-400 mb-4" /><CardTitle className="text-white">Share Ideas</CardTitle><CardDescription className="text-gray-300">Post your thoughts, get feedback on concepts, and collaborate on innovative projects.</CardDescription></CardHeader></Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold text-purple-400 mb-2">50K+</div><div className="text-gray-300">Active Developers</div></div>
            <div><div className="text-4xl font-bold text-blue-400 mb-2">25K+</div><div className="text-gray-300">Projects Showcased</div></div>
            <div><div className="text-4xl font-bold text-green-400 mb-2">1M+</div><div className="text-gray-300">Connections Made</div></div>
            <div><div className="text-4xl font-bold text-yellow-400 mb-2">500+</div><div className="text-gray-300">Companies Hiring</div></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Join the Community?</h2>
          <p className="text-xl text-gray-300 mb-8">Create your account first, then sign in to enter the platform.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg">Create Your Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0"><Code2 className="h-6 w-6 text-purple-400" /><span className="text-xl font-bold text-white">DevHeaven</span></div>
            <div className="flex space-x-6"><Github className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" /><Twitter className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" /><Linkedin className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" /></div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400"><p>&copy; 2024 DevHeaven. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  )
}
