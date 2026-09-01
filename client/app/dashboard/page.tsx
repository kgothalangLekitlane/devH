"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Code2, Github, Linkedin, Globe, MessageCircle, Heart, MessageSquare, Share2, Trash2, Plus, Search, RefreshCw, Users, FolderKanban, Eye, LogOut, Menu, X, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { assetUrl, createPost, deletePost, fetchConnections, fetchMe, fetchNotifications, fetchPosts, fetchProjects, getUnreadCount, likePost, markNotificationRead, fetchComments, addComment, recordProfileView } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MobileNav } from "@/components/MobileNav";

type DashboardPost = { _id: string; title?: string; content?: string; body?: string; author?: any; user?: any; likes?: any[]; comments?: any[]; createdAt?: string; updatedAt?: string; [key: string]: any };

type DashboardComment = { _id: string; content?: string; text?: string; author?: any; user?: any; createdAt?: string; [key: string]: any };

export default function DashboardPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<DashboardPost | null>(null);
  const [comments, setComments] = useState<DashboardComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [showComposer, setShowComposer] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [query, setQuery] = useState("");
  const [feedMode, setFeedMode] = useState<"latest" | "popular">("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchPosts(token);
      const nextPosts = Array.isArray(data) ? data : data?.posts || [];
      setPosts(nextPosts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load posts.");
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [postResult, notificationResult, connectionResult, projectResult, meResult] = await Promise.allSettled([
          fetchPosts(token), fetchNotifications(token), fetchConnections(token), fetchProjects(), fetchMe(token)
        ]);
        if (!active) return;
        if (postResult.status === "fulfilled") { const value: any = postResult.value; setPosts(Array.isArray(value) ? value : value?.posts || []); }
        if (notificationResult.status === "fulfilled") { const value: any = notificationResult.value; setNotifications(Array.isArray(value) ? value : value?.notifications || []); }
        if (connectionResult.status === "fulfilled") { const value: any = connectionResult.value; setConnectionCount((value?.connections || value || []).length); }
        if (projectResult.status === "fulfilled") { const value: any = projectResult.value; setProjectCount((value?.projects || value || []).length); }
        if (meResult.status === "fulfilled") { const value: any = meResult.value; setProfileViews(Number(value?.user?.profileViews || value?.profileViews || 0)); }
        try { setUnreadMessages(await getUnreadCount(token)); } catch { /* optional */ }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Unable to load dashboard."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token, authLoading]);

  const createNewPost = async () => {
    if (!token || !newPost.title.trim() || !newPost.content.trim()) return;
    setLoading(true);
    try { await createPost(newPost, token); setNewPost({ title: "", content: "" }); setShowComposer(false); await loadPosts(); toast({ title: "Post published" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create post."); }
    finally { setLoading(false); }
  };

  const updateSelectedPost = (id: string, updater: (post: DashboardPost) => DashboardPost) => {
    setPosts(current => current.map(post => String(post._id) === String(id) ? updater(post) : post));
    setSelectedPost((current: DashboardPost | null) => current && String(current._id) === String(id) ? updater(current) : current);
  };

  const handleLike = async (id: string) => {
    if (!token) return;
    try {
      const result: any = await likePost(id, token);
      updateSelectedPost(id, post => ({ ...post, ...result, likes: result?.likes ?? post.likes }));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to like post."); }
  };

  const openPost = async (post: DashboardPost) => {
    setSelectedPost(post); setComments([]);
    try { if (token) { const result: any = await fetchComments(post._id, token); setComments(Array.isArray(result) ? result : result?.comments || []); } }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load comments."); }
  };

  const submitComment = async () => {
    if (!token || !selectedPost || !newComment.trim()) return;
    try { const result: any = await addComment(selectedPost._id, newComment.trim(), token); setComments(current => [...current, result?.comment || result]); setNewComment(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to add comment."); }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try { await deletePost(id, token); setPosts(current => current.filter(post => String(post._id) !== String(id))); setSelectedPost(null); toast({ title: "Post deleted" }); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to delete post."); }
  };

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      const text = `${post.title || ""} ${post.content || post.body || ""} ${post.author?.username || post.user?.username || ""}`.toLowerCase();
      return !query.trim() || text.includes(query.trim().toLowerCase());
    });
    if (feedMode === "popular") return [...filtered].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    return [...filtered].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [posts, query, feedMode]);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "D";
  if (authLoading || loading && !posts.length) return <div className="min-h-screen flex items-center justify-center text-gray-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading DevHeaven...</div>;
  if (!token) return <div className="min-h-screen flex items-center justify-center"><Card><CardContent className="p-8 text-center"><h1 className="text-xl font-semibold">Please sign in</h1><p className="mt-2 text-sm text-gray-500">Your DevHeaven session is not active.</p><Link href="/login"><Button className="mt-4">Sign in</Button></Link></CardContent></Card></div>;

  return <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
    <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold"><Code2 className="text-purple-600" />DevHeaven</Link>
      <div className="hidden items-center gap-2 md:flex"><Link href="/network"><Button variant="ghost"><Users className="mr-2 h-4 w-4" />Network</Button></Link><Link href="/messages"><Button variant="ghost"><MessageCircle className="mr-2 h-4 w-4" />Messages{unreadMessages > 0 && <Badge className="ml-2">{unreadMessages}</Badge>}</Button></Link><Link href={`/profile/${user?.id}`}><Avatar className="h-9 w-9"><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback>{initials}</AvatarFallback></Avatar></Link><Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button></div>
      <Button variant="ghost" className="md:hidden" onClick={() => setMobileMenuOpen(v => !v)}>{mobileMenuOpen ? <X /> : <Menu />}</Button>
    </div></nav>
    {mobileMenuOpen && <div className="border-b bg-white p-4 md:hidden"><div className="grid gap-2"><Link href="/network"><Button className="w-full" variant="outline">Network</Button></Link><Link href="/messages"><Button className="w-full" variant="outline">Messages</Button></Link><Link href="/profile"><Button className="w-full" variant="outline">Profile</Button></Link><Button className="w-full" variant="outline" onClick={logout}>Sign out</Button></div></div>}
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
      <aside className="hidden lg:block"><Card><CardContent className="space-y-2 p-4"><Link href={`/profile/${user?.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"><Avatar><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div><p className="font-medium">{user?.firstName} {user?.lastName}</p><p className="text-xs text-gray-500">@{user?.username}</p></div></Link><Link href="/projects"><Button variant="ghost" className="w-full justify-start"><FolderKanban className="mr-2 h-4 w-4" />Projects</Button></Link><Link href="/network"><Button variant="ghost" className="w-full justify-start"><Users className="mr-2 h-4 w-4" />My network</Button></Link></CardContent></Card></aside>
      <section className="space-y-5">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(user?.profileImage)} /><AvatarFallback>{initials}</AvatarFallback></Avatar><Button variant="outline" className="flex-1 justify-start text-gray-500" onClick={() => setShowComposer(true)}>Share something with the community...</Button><Button onClick={() => setShowComposer(true)}><Plus className="mr-2 h-4 w-4" />Post</Button></div></CardContent></Card>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your feed" /></div><div className="flex gap-2"><Button variant={feedMode === "latest" ? "default" : "outline"} onClick={() => setFeedMode("latest")}>Latest</Button><Button variant={feedMode === "popular" ? "default" : "outline"} onClick={() => setFeedMode("popular")}>Popular</Button></div></div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {filteredPosts.length ? filteredPosts.map(post => <Card key={post._id} className="overflow-hidden"><CardHeader><div className="flex items-start justify-between"><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(post.author?.profileImage || post.user?.profileImage)} /><AvatarFallback>{`${post.author?.firstName?.[0] || post.user?.firstName?.[0] || "D"}`}</AvatarFallback></Avatar><div><p className="font-medium">{post.author?.firstName || post.user?.firstName || post.author?.username || post.user?.username || "Developer"} {post.author?.lastName || post.user?.lastName || ""}</p><p className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}</p></div></div>{(String(post.author?._id || post.author?.id || post.user?._id || post.user?.id) === String(user?.id)) && <Button variant="ghost" size="icon" onClick={() => void handleDelete(post._id)}><Trash2 className="h-4 w-4" /></Button>}</div><CardTitle className="pt-2">{post.title}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-gray-700">{post.content || post.body}</p><div className="mt-5 flex items-center gap-2 border-t pt-3"><Button variant="ghost" size="sm" onClick={() => void handleLike(post._id)}><Heart className="mr-1 h-4 w-4" />{post.likes?.length || 0}</Button><Button variant="ghost" size="sm" onClick={() => void openPost(post)}><MessageSquare className="mr-1 h-4 w-4" />{post.comments?.length || 0}</Button><Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/dashboard?post=${post._id}`)}><Share2 className="mr-1 h-4 w-4" />Share</Button></div></CardContent></Card>) : <Card><CardContent className="py-16 text-center"><Code2 className="mx-auto h-10 w-10 text-gray-300" /><h3 className="mt-4 font-semibold">Your DevHeaven feed is ready</h3><p className="mt-1 text-sm text-gray-500">Be the first to share something with the developer community.</p><Button className="mt-4" onClick={() => setShowComposer(true)}>Create a post</Button></CardContent></Card>}
      </section>
      <aside className="hidden space-y-4 lg:block"><Card><CardHeader><CardTitle className="text-base">Your activity</CardTitle></CardHeader><CardContent className="grid gap-4"><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Users className="h-4 w-4" />Connections</span><strong>{connectionCount}</strong></div><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><FolderKanban className="h-4 w-4" />Projects</span><strong>{projectCount}</strong></div><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Eye className="h-4 w-4" />Profile views</span><strong>{profileViews}</strong></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader><CardContent className="space-y-2">{notifications.slice(0, 5).map((n: any) => <button key={n._id || n.id} className="block w-full rounded-md p-2 text-left text-sm hover:bg-gray-50" onClick={() => n._id && token && void markNotificationRead(n._id, token)}>{n.message || n.text || "New activity on your account"}</button>)}{!notifications.length && <p className="text-sm text-gray-500">You're all caught up.</p>}</CardContent></Card></aside>
    </main>
    <MobileNav />
    <Dialog open={showComposer} onOpenChange={setShowComposer}><DialogContent><DialogHeader><DialogTitle>Create a post</DialogTitle></DialogHeader><div className="space-y-4"><Input value={newPost.title} onChange={e => setNewPost(v => ({ ...v, title: e.target.value }))} placeholder="Title" /><Textarea value={newPost.content} onChange={e => setNewPost(v => ({ ...v, content: e.target.value }))} placeholder="What do you want to share?" rows={6} /><Button onClick={() => void createNewPost()} disabled={!newPost.title.trim() || !newPost.content.trim() || loading}>Publish</Button></div></DialogContent></Dialog>
    <Dialog open={!!selectedPost} onOpenChange={open => !open && setSelectedPost(null)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selectedPost?.title}</DialogTitle></DialogHeader><p className="whitespace-pre-wrap text-gray-700">{selectedPost?.content || selectedPost?.body}</p><div className="border-t pt-4"><h3 className="font-medium">Comments</h3><div className="mt-3 space-y-3">{comments.map(comment => <div key={comment._id} className="rounded-lg bg-gray-50 p-3 text-sm"><p className="font-medium">{comment.author?.username || comment.user?.username || "Developer"}</p><p className="mt-1">{comment.content || comment.text}</p></div>)}</div><div className="mt-4 flex gap-2"><Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitComment(); } }} /><Button onClick={() => void submitComment()} disabled={!newComment.trim()}>Comment</Button></div></div></DialogContent></Dialog>
  </div>;
}
