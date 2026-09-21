"use client"

import { useEffect, useState } from "react"
import { Github, Star, GitFork, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGithubUser, getMyGithub } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type Repo = {
  id: number
  name: string
  fullName?: string
  description?: string
  url: string
  language?: string
  stars: number
  forks: number
  updatedAt: string
}

type GithubData = {
  profile: {
    login: string
    name?: string
    avatar: string
    htmlUrl: string
    bio?: string
    publicRepos: number
    followers: number
    following: number
  }
  repositories: Repo[]
  languages: Record<string, number>
}

const extractGithubUsername = (value?: string) => {
  const raw = String(value || "").trim()
  if (!raw) return ""
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    if (!/^(www\.)?github\.com$/i.test(url.hostname)) return ""
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts.length !== 1 || !/^[A-Za-z0-9-]{1,39}$/.test(parts[0])) return ""
    return parts[0]
  } catch {
    return ""
  }
}

export default function GitHubIdentity() {
  const { token, user } = useAuth()
  const [data, setData] = useState<GithubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")

    const savedGithubUrl = user?.socialLinks?.github
    const username = extractGithubUsername(savedGithubUrl)

    if (!username) {
      setData(null)
      setError("Add your GitHub profile URL in Edit Profile first (for example, https://github.com/username).")
      setLoading(false)
      return
    }

    try {
      // Prefer the public endpoint derived from the URL currently held by the
      // authenticated profile. This avoids stale /api/github/me state.
      setData(await getGithubUser(username))
    } catch (publicError: any) {
      // Keep the authenticated endpoint as a fallback for older deployments.
      try {
        setData(await getMyGithub(token))
      } catch (authError: any) {
        setError(publicError?.message || authError?.message || "Unable to load GitHub profile")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, user?.socialLinks?.github])

  if (loading) {
    return <Card><CardContent className="p-6">Loading GitHub profile...</CardContent></Card>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <p className="text-sm text-gray-600">{error}</p>
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data?.profile) return null

  const profile = data.profile
  const repositories = Array.isArray(data.repositories) ? data.repositories : []
  const languages = data.languages && typeof data.languages === "object" ? data.languages : {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />GitHub identity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <img src={profile.avatar} alt={profile.login} className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-lg">{profile.name || profile.login}</h3>
              <a href={profile.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 inline-flex items-center gap-1">
                @{profile.login}<ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-1">{profile.bio || "No GitHub bio"}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
              <span>{profile.publicRepos} repositories</span>
              <span>{profile.followers} followers</span>
              <span>{profile.following} following</span>
            </div>
          </div>
        </div>

        {Object.keys(languages).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.keys(languages).map(language => (
              <span key={language} className="rounded-full bg-purple-50 text-purple-700 px-2.5 py-1 text-xs">
                {language}
              </span>
            ))}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Featured repositories</h4>
            <Button variant="ghost" size="sm" onClick={load} aria-label="Refresh GitHub profile">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {repositories.length === 0 ? (
            <p className="text-sm text-gray-500">No public repositories found.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {repositories.slice(0, 6).map(repo => (
                <a key={repo.id} href={repo.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border p-4 hover:border-purple-300 transition-colors">
                  <div className="font-medium truncate">{repo.name}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-8">{repo.description || "No description"}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span>{repo.language || "Unknown"}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
                    <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" />{repo.forks}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
