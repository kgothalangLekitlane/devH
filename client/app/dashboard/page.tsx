"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, Code2, Search, Plus, Bell, Trash2, X, Users, Briefcase, BookOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { fetchPosts, createPost, likePost, fetchProjects, fetchUserById, assetUrl, fetchUnreadMessageCount, addComment, deletePost, deleteComment, fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchConnectionSummary } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectionStatus } from "@/components/ConnectionStatus";

type FeedMode = "latest" | "popular";

export default function Dashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [profileViewCount, setProfileViewCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>("latest");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const visiblePosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? posts.filter((p) => `${p.title || ""} ${p.content || ""} ${p.author?.firstName || ""} ${p.author?.lastName || ""}`.toLowerCase().includes(term))
      : posts;
    return [...filtered].sort((a, b) => feedMode === "popular"
      ? (Number(b.likes?.length) || 0) - (Number(a.likes?.length) || 0)
      : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [posts, searchTerm, feedMode]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Unable to load your feed. Please try again.");
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    try { await loadPosts(); }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    if (!isLoading && !user) router.push("/auth/login");
    if (user) void loadPosts();
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || !token) return;
    let active = true;
    const load = async () => {
      try {
        const [projects, profile, notificationsData, messages, connections] = await Promise.all([
          fetchProjects(),
          fetchUserById(String(user.id)),
          fetchNotifications(token),
          fetchUnreadMessageCount(token),
          fetchConnectionSummary(token),
        ]);
        if (!active) return;
        const projectList = Array.isArray(projects?.projects) ? projects.projects : [];
        setProjectCount(projectList.filter((x: any) => String(x.owner?.id || x.owner?._id || x.userId || x.user?._id || "") === String(user.id)).length);
        setProfileViewCount(Number(profile?.profileViewCount) || 0);
        setNotifications(Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : Array.isArray(notificationsData) ? notificationsData : []);
        setUnreadMessages(Math.max(0, Number(messages?.count) || 0));
        setConnectionCount(Math.max(0, Number(connections?.count) || 0));
      } catch (e) {
        console.error("Dashboard refresh error:", e);
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user, token]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPost.title.trim() || !newPost.content.trim()) return;
    setLoading(true);
    try {
      await createPost(newPost, token);
      setNewPost({ title: "", content: "" });
      await loadPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create post.");
    } finally { setLoading(false); }
  };

  const updateSelectedPost = (id: string, updater: (post: any) => any) => {
    setPosts((current) => current.map((post) => String(post._id) === String(id) ? updater(post) : post));
    setSelectedPost((current) => current && String(current._id) === String(id) ? updater(current) : current);
  };

  const handleLike = async (id: string) => {
    if (!token) return;
    try {
      const response = await likePost(id, token);
      const likes = response?.post?.likes || response?.likes;
      if (Array.isArray(likes)) updateSelectedPost(id, (post) => ({ ...post, likes }));
      else await loadPosts();
    } catch { setError("Failed to update the like."); }
  };

  const handleAddComment = async (id: string) => {
    if (!token || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      await addComment(id, commentText.trim(), token);
      setCommentText("");
      const data = await fetchPosts();
      const updated = Array.isArray(data) ? data.find((p: any) => String(p._id) === String(id)) : null;
      if (updated) updateSelectedPost(id, () => updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add comment.");
    } finally { setCommentLoading(false); }
  };

  const handleDeletePost = async (id: string) => {
    if (!token || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingPostId(id);
    try {
      await deletePost(id, token);
      setPosts((current) => current.filter((p) => String(p._id) !== String(id)));
      if (String(selectedPost?._id) === String(id)) setSelectedPost(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete post."); }
    finally { setDeletingPostId(null); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!token || !window.confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(postId, commentId, token);
      const data = await fetchPosts();
      const updated = Array.isArray(data) ? data.find((p: any) => String(p._id) === String(postId)) : null;
      if (updated) updateSelectedPost(postId, () => updated);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete comment."); }
    finally { setDeletingCommentId(null); }
  };

  const markOne = async (notification: any) => {
    if (!token) return;
    try {
      await markNotificationRead(String(notification._id), token);
      setNotifications((current) => current.map((n) => String(n._id) === String(notification._id) ? { ...n, read: true } : n));
      if (notification.link) router.push(notification.link);
    } catch (e) { console.error(e); }
  };

  const markAll = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const sharePost = async (post: any) => {
    const url = `${window.location.origin}/dashboard?post=${encodeURIComponent(String(post._id))}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.content, url });
      else { await navigator.clipboard.writeText(url); setShareStatus("Link copied"); window.setTimeout(() => setShareStatus(null), 1800); }
    } catch { /* User cancelled native share. */ }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading DevHeaven...</div>;
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "U";
  const profileImage = assetUrl(user.profileImage);
  const isOwnPost = (post: any) => String(post.author?._id || post.author?.id || post.author) === String(user.id);
  const isOwnComment = (comment: any) => String(comment.user?._id || comment.user?.id || comment.user) === String(user.id);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <nav className="bg-white/95 backdrop-blur border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0"><Code2 className="h-8 w-8 text-purple-600" /><span className="text-xl sm:text-2xl font-bold">DevHeaven</span></Link>
          <div className="hidden lg:flex gap-6 text-sm"><Link href="/dashboard" className="text-purple-600 font-semibold">Feed</Link><Link href="/projects">Projects</Link><Link href="/resources">Resources</Link><Link href="/recruiters">Jobs</Link></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ConnectionStatus />
            <div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input aria-label="Search posts" placeholder="Search posts..." className="pl-10 w-48 lg:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Button size="sm" onClick={() => document.getElementById("create-post")?.scrollIntoView({ behavior: "smooth" })}><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Post</span></Button>
            <div className="relative"><button type="button" aria-label="Notifications" onClick={() => setShowNotifications((x) => !x)} className="relative h-9 w-9 rounded-full text-gray-600 hover:bg-gray-100 hover:text-purple-600 flex items-center justify-center"><Bell className="h-5 w-5" />{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</button>
              {showNotifications && <Card className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 shadow-xl z-50"><CardHeader className="flex flex-row items-center justify-between pb-3"><span className="font-semibold">Notifications</span><button onClick={markAll} className="text-xs text-purple-600 hover:underline">Mark all as read</button></CardHeader><CardContent className="p-0 max-h-96 overflow-y-auto">{notifications.length === 0 ? <p className="p-5 text-sm text-gray-500">No notifications yet.</p> : notifications.map((n) => <button key={n._id} onClick={() => void markOne(n)} className={`w-full text-left px-4 py-3 border-t hover:bg-gray-50 ${!n.read ? "bg-purple-50" : ""}`}><div className="text-sm font-medium">{n.title || n.text || n.message || "New activity"}</div><div className="text-xs text-gray-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div></button>)}</CardContent></Card>}
            </div>
            <Link href="/messages" aria-label="Messages" className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"><MessageCircle className="h-5 w-5" />{unreadMessages > 0 && <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</Link>
            <Link href="/profile" aria-label="Profile"><Avatar className="h-9 w-9"><AvatarImage src={profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar></Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <Card><CardHeader><div className="flex items-center gap-3"><Avatar className="h-12 w-12"><AvatarImage src={profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div className="min-w-0"><h3 className="font-semibold truncate">{user.firstName} {user.lastName}</h3><p className="text-sm text-gray-500 truncate">{user.location || "Developer"}</p></div></div></CardHeader><CardContent className="grid grid-cols-3 lg:grid-cols-1 gap-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Projects</span><b>{projectCount}</b></div><div className="flex justify-between"><span className="text-gray-500">Connections</span><b>{connectionCount}</b></div><div className="flex justify-between"><span className="text-gray-500">Profile views</span><b>{profileViewCount}</b></div></CardContent></Card>
            <div className="hidden lg:block"><Card><CardContent className="p-4 space-y-3 text-sm"><Link href="/connections" className="flex items-center gap-3 hover:text-purple-600"><Users className="h-4 w-4" /> Grow your network</Link><Link href="/projects" className="flex items-center gap-3 hover:text-purple-600"><Code2 className="h-4 w-4" /> Showcase a project</Link><Link href="/recruiters" className="flex items-center gap-3 hover:text-purple-600"><Briefcase className="h-4 w-4" /> Explore opportunities</Link><Link href="/resources" className="flex items-center gap-3 hover:text-purple-600"><BookOpen className="h-4 w-4" /> Keep learning</Link></CardContent></Card></div>
          </aside>

          <section className="lg:col-span-2 space-y-5">
            <div className="sm:hidden relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input aria-label="Search posts" placeholder="Search your feed..." className="pl-10 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Card id="create-post"><CardHeader><h2 className="font-semibold">Share with the community</h2><p className="text-sm text-gray-500">Ask a question, share a project, or start a conversation.</p></CardHeader><CardContent><form onSubmit={handleCreatePost} className="space-y-3"><Input aria-label="Post title" placeholder="Post title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} maxLength={120} /><textarea aria-label="Post content" className="w-full min-h-24 rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500" placeholder="What are you building?" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} maxLength={5000} /><div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">{newPost.content.length}/5000</span><Button type="submit" disabled={loading || !newPost.title.trim() || !newPost.content.trim()}>{loading ? "Publishing..." : "Publish"}</Button></div></form></CardContent></Card>
            {error && <div role="alert" className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex items-center justify-between gap-3"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}
            <div className="flex items-center justify-between gap-3"><div className="flex rounded-lg bg-white border p-1 text-sm"><button onClick={() => setFeedMode("latest")} className={`px-3 py-1.5 rounded-md ${feedMode === "latest" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-500"}`}>Latest</button><button onClick={() => setFeedMode("popular")} className={`px-3 py-1.5 rounded-md ${feedMode === "popular" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-500"}`}>Popular</button></div><Button variant="ghost" size="sm" onClick={() => void refreshDashboard()} disabled={refreshing} aria-label="Refresh feed"><RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button></div>

            {visiblePosts.length === 0 ? <Card><CardContent className="py-12 text-center"><Code2 className="h-10 w-10 mx-auto text-gray-300 mb-3" /><h3 className="font-semibold">{searchTerm ? "No posts found" : "Your feed is waiting"}</h3><p className="text-sm text-gray-500 mt-1">{searchTerm ? "Try another search term." : "Be the first to share something with the developer community."}</p></CardContent></Card> : visiblePosts.map((post) => <Card key={post._id} className="transition-shadow hover:shadow-md"><CardContent className="p-5 sm:p-6"><div className="flex justify-between gap-3"><div className="flex gap-3 min-w-0"><Avatar><AvatarImage src={assetUrl(post.author?.profileImage) || "/placeholder.svg"} /><AvatarFallback>{post.author?.firstName?.[0] || "U"}</AvatarFallback></Avatar><div className="min-w-0"><button className="font-semibold hover:text-purple-600 text-left" onClick={() => setSelectedPost(post)}>{post.author?.firstName} {post.author?.lastName}</button><p className="text-xs text-gray-500">{post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recently"}</p></div></div>{isOwnPost(post) && <Button aria-label="Delete post" variant="ghost" size="icon" disabled={deletingPostId === post._id} onClick={() => void handleDeletePost(String(post._id))}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</div><button className="block w-full text-left mt-4" onClick={() => setSelectedPost(post)}><h3 className="font-semibold text-lg">{post.title}</h3><p className="mt-2 text-gray-700 whitespace-pre-wrap line-clamp-5">{post.content}</p></button><div className="flex items-center gap-1 mt-5 pt-3 border-t text-sm text-gray-500"><Button variant="ghost" size="sm" onClick={() => void handleLike(String(post._id))}><Heart className="mr-2 h-4 w-4" />{post.likes?.length || 0}</Button><Button variant="ghost" size="sm" onClick={() => setSelectedPost(post)}><MessageCircle className="mr-2 h-4 w-4" />{post.comments?.length || 0}</Button><Button variant="ghost" size="sm" onClick={() => void sharePost(post)}><Share2 className="mr-2 h-4 w-4" />Share</Button>{shareStatus && <span className="ml-auto text-xs text-green-600">{shareStatus}</span>}</div></CardContent></Card>)}
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t md:hidden"><div className="grid grid-cols-5 h-16"><Link href="/dashboard" className="flex flex-col items-center justify-center text-purple-600 text-[11px] gap-1"><Code2 className="h-5 w-5" />Feed</Link><Link href="/projects" className="flex flex-col items-center justify-center text-gray-500 text-[11px] gap-1"><Code2 className="h-5 w-5" />Projects</Link><Link href="/connections" className="flex flex-col items-center justify-center text-gray-500 text-[11px] gap-1"><Users className="h-5 w-5" />Network</Link><Link href="/recruiters" className="flex flex-col items-center justify-center text-gray-500 text-[11px] gap-1"><Briefcase className="h-5 w-5" />Jobs</Link><Link href="/resources" className="flex flex-col items-center justify-center text-gray-500 text-[11px] gap-1"><BookOpen className="h-5 w-5" />Learn</Link></div></div>

      {selectedPost && <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setSelectedPost(null)}><Card className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}><CardHeader className="flex flex-row justify-between sticky top-0 bg-white z-10"><div><span className="font-semibold">{selectedPost.title}</span><p className="text-xs text-gray-500 mt-1">{selectedPost.author?.firstName} {selectedPost.author?.lastName}</p></div><button aria-label="Close post" onClick={() => setSelectedPost(null)}><X /></button></CardHeader><CardContent><p className="whitespace-pre-wrap text-gray-700">{selectedPost.content}</p><div className="flex flex-wrap gap-2 mt-5 border-b pb-4"><Button variant="ghost" onClick={() => void handleLike(String(selectedPost._id))}><Heart className="mr-2 h-4 w-4" />Like {selectedPost.likes?.length || 0}</Button><Button variant="ghost" onClick={() => void sharePost(selectedPost)}><Share2 className="mr-2 h-4 w-4" />Share</Button>{isOwnPost(selectedPost) && <Button variant="ghost" onClick={() => void handleDeletePost(String(selectedPost._id))} disabled={!!deletingPostId}><Trash2 className="mr-2 h-4 w-4 text-red-500" />Delete</Button>}</div><div className="mt-5 space-y-3">{(selectedPost.comments || []).length === 0 ? <p className="text-sm text-gray-500">No comments yet. Start the conversation.</p> : (selectedPost.comments || []).map((comment: any) => <div key={comment._id} className="rounded-lg bg-gray-50 p-3 flex justify-between gap-3"><div><b className="text-sm">{comment.user?.firstName} {comment.user?.lastName}</b><p className="text-sm mt-1">{comment.text}</p></div>{isOwnComment(comment) && <button aria-label="Delete comment" onClick={() => void handleDeleteComment(String(selectedPost._id), String(comment._id))} disabled={deletingCommentId === String(comment._id)}><Trash2 className="h-4 w-4 text-red-500" /></button>}</div>)}</div><div className="mt-5 flex gap-2"><Input aria-label="Write a comment" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAddComment(String(selectedPost._id)); } }} /><Button onClick={() => void handleAddComment(String(selectedPost._id))} disabled={commentLoading || !commentText.trim()}>{commentLoading ? "..." : "Comment"}</Button></div></CardContent></Card></div>}
    </div>
  );
}
