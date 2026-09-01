"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Github, Star, GitFork, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyGithub } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type Repo={name:string;html_url:string;description?:string;language?:string;stargazers_count:number;forks_count:number;updated_at:string}
type GithubData={login:string;name?:string;avatar_url:string;html_url:string;bio?:string;public_repos:number;followers:number;following:number;repos:Repo[];languages:string[]}

export default function GitHubIdentity(){
 const {token}=useAuth(); const [data,setData]=useState<GithubData|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("")
 const load=async()=>{if(!token)return;setLoading(true);setError("");try{setData(await getMyGithub(token))}catch(e:any){setError(e.message||"Unable to load GitHub data")}finally{setLoading(false)}}
 useEffect(()=>{load()},[token])
 if(loading)return <Card><CardContent className="p-6">Loading GitHub profile...</CardContent></Card>
 if(error)return <Card><CardContent className="p-6 space-y-3"><p className="text-sm text-gray-600">{error}</p><Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2"/>Retry</Button></CardContent></Card>
 if(!data)return null
 return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Github className="h-5 w-5"/>GitHub identity</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex flex-col sm:flex-row gap-4 items-start"><img src={data.avatar_url} alt={data.login} className="h-16 w-16 rounded-full"/><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-lg">{data.name||data.login}</h3><Link href={data.html_url} target="_blank" className="text-sm text-purple-600 inline-flex items-center gap-1">@{data.login}<ExternalLink className="h-3 w-3"/></Link></div><p className="text-sm text-gray-600 mt-1">{data.bio||"No GitHub bio"}</p><div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3"><span>{data.public_repos} repositories</span><span>{data.followers} followers</span><span>{data.following} following</span></div></div></div><div className="flex flex-wrap gap-2">{data.languages.map(language=><span key={language} className="rounded-full bg-purple-50 text-purple-700 px-2.5 py-1 text-xs">{language}</span>)}</div><div><div className="flex justify-between items-center mb-3"><h4 className="font-medium">Featured repositories</h4><Button variant="ghost" size="sm" onClick={load}><RefreshCw className="h-4 w-4"/></Button></div><div className="grid md:grid-cols-2 gap-3">{data.repos.slice(0,6).map(repo=><Link key={repo.html_url} href={repo.html_url} target="_blank" className="rounded-lg border p-4 hover:border-purple-300 transition-colors"><div className="font-medium truncate">{repo.name}</div><p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-8">{repo.description||"No description"}</p><div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500"><span>{repo.language||"Unknown"}</span><span className="inline-flex items-center gap-1"><Star className="h-3 w-3"/>{repo.stargazers_count}</span><span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3"/>{repo.forks_count}</span></div></Link>)}</div></div></CardContent></Card>
}
