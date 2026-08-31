"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Code2, Search, Plus, Bell, Trash2, X } from "lucide-react";
import Link from "next/link";
import { fetchPosts, createPost, likePost, fetchProjects, fetchUserById, assetUrl, fetchUnreadMessageCount, addComment, deletePost, deleteComment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function Dashboard() {
  const { user, token, isLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [profileViewCount, setProfileViewCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const router = useRouter();

  const visiblePosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post: any) => `${post.title || ""} ${post.content || ""} ${post.author?.firstName || ""} ${post.author?.lastName || ""}`.toLowerCase().includes(term));
  }, [posts, searchTerm]);

  useEffect(() => {
    if (!isLoading && !user) { router.push("/auth/login"); return; }
    if (user) void loadPosts();
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const [projectBody, currentUser] = await Promise.all([fetchProjects(), fetchUserById(String(user.id))]);
        const projects = Array.isArray(projectBody?.projects) ? projectBody.projects : [];
        const myId = String(user.id || "");
        setProjectCount(projects.filter((project: any) => String(project.owner?.id || project.owner?._id || project.userId || project.user?._id || "") === myId).length);
        setProfileViewCount(Number(currentUser?.profileViewCount) || 0);
      } catch (err) { console.error("Unable to load dashboard stats", err); }
    };
    void loadStats();
  }, [user]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const loadUnread = async () => { try { const body = await fetchUnreadMessageCount(token); if (active) setUnreadMessages(Math.max(0, Number(body?.count) || 0)); } catch (err) { console.error(err); } };
    void loadUnread();
    const timer = window.setInterval(loadUnread, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [token]);

  const loadPosts = async () => {
    try { const data = await fetchPosts(); setPosts(Array.isArray(data) ? data : []); setError(""); }
    catch (err) { console.error(err); setError("Unable to load posts."); }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault(); if (!token || !newPost.title.trim() || !newPost.content.trim()) return;
    setLoading(true);
    try { await createPost(newPost, token); setNewPost({ title: "", content: "" }); await loadPosts(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to create post."); }
    finally { setLoading(false); }
  };

  const handleLike = async (postId: string) => { if (!token) return; try { await likePost(postId, token); await loadPosts(); const refreshed = (await fetchPosts()).find((p: any) => String(p._id) === String(postId)); if (refreshed) setSelectedPost(refreshed); } catch { setError("Failed to like post."); } };

  const handleAddComment = async (postId: string) => {
    if (!token || !commentText.trim()) return; setCommentLoading(true);
    try { await addComment(postId, commentText.trim(), token); setCommentText(""); await loadPosts(); const refreshed = (await fetchPosts()).find((p: any) => String(p._id) === String(postId)); if (refreshed) setSelectedPost(refreshed); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to add comment."); }
    finally { setCommentLoading(false); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token || !window.confirm("Delete this post? This cannot be undone.")) return; setDeletingPostId(postId);
    try { await deletePost(postId, token); setPosts((current) => current.filter((post) => String(post._id) !== String(postId))); if (selectedPost?._id === postId) setSelectedPost(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete post."); }
    finally { setDeletingPostId(null); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!token || !window.confirm("Delete this comment?")) return; setDeletingCommentId(commentId);
    try { await deleteComment(postId, commentId, token); const refreshedPosts = await fetchPosts(); const list = Array.isArray(refreshedPosts) ? refreshedPosts : []; setPosts(list); setSelectedPost(list.find((p: any) => String(p._id) === String(postId)) || null); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete comment."); }
    finally { setDeletingCommentId(null); }
  };

  const handleShare = async (postId: string) => { const shareUrl = `${window.location.origin}/dashboard?post=${postId}`; try { await navigator.clipboard.writeText(shareUrl); setError("Share link copied to clipboard."); } catch { setError(`Copy this link: ${shareUrl}`); } };
  const handleQuickPost = () => document.getElementById("create-post")?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div>Loading...</div></div>;
  if (!user) return null;
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "U";
  const profileImage = assetUrl(user.profileImage);
  const isOwnPost = (post: any) => String(post.author?._id || post.author?.id || post.author) === String(user.id);
  const isOwnComment = (comment: any) => String(comment.user?._id || comment.user?.id || comment.user) === String(user.id);

  return <div className="min-h-screen bg-gray-50">
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center py-4">
      <div className="flex items-center space-x-8"><Link href="/" className="flex items-center space-x-2"><Code2 className="h-8 w-8 text-purple-600" /><span className="text-2xl font-bold text-gray-900">DevHeaven</span></Link><div className="hidden md:flex items-center space-x-6"><Link href="/dashboard" className="text-purple-600 font-medium">Feed</Link><Link href="/projects" className="text-gray-600 hover:text-purple-600">Projects</Link><Link href="/resources" className="text-gray-600 hover:text-purple-600">Resources</Link><Link href="/recruiters" className="text-gray-600 hover:text-purple-600">Jobs</Link></div></div>
      <div className="flex items-center space-x-3"><ConnectionStatus /><div className="relative hidden sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input placeholder="Search posts..." className="pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleQuickPost}><Plus className="h-4 w-4 mr-2" />Post</Button><button type="button" aria-label="Toggle notifications" onClick={() => setShowNotifications((p) => !p)} className="text-gray-600 hover:text-purple-600"><Bell className="h-6 w-6" /></button><Link href="/messages" aria-label="Messages" className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-purple-600"><MessageCircle className="h-6 w-6" />{unreadMessages > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</Link><Link href="/profile"><Avatar className="h-8 w-8"><AvatarImage src={profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar></Link></div>
    </div></div></nav>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <aside className="lg:col-span-1">{showNotifications && <Card className="mb-6"><CardContent className="pt-6 text-sm text-gray-600">You&apos;ll see notifications here as real activity occurs.</CardContent></Card>}<Card id="create-post"><CardHeader><div className="flex items-center space-x-3"><Avatar className="h-12 w-12"><AvatarImage src={profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div><h3 className="font-semibold">{user.firstName} {user.lastName}</h3><p className="text-sm text-gray-600">{user.location || "Developer"}</p></div></div></CardHeader><CardContent><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-600">Connections</span><ConnectionStatus /></div><div className="flex justify-between"><span className="text-gray-600">Projects</span><span className="font-medium">{projectCount}</span></div><div className="flex justify-between"><span className="text-gray-600">Profile Views</span><span className="font-medium">{profileViewCount}</span></div></div></CardContent></Card></aside>
      <main className="lg:col-span-2"><Card className="mb-6"><CardContent className="pt-6"><form onSubmit={handleCreatePost}><div className="flex space-x-3"><Avatar className="h-10 w-10"><AvatarImage src={profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div className="flex-1"><Input placeholder="Post title..." value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} className="mb-3" required /><Textarea placeholder="Share your thoughts, projects, or ask questions..." className="min-h-[100px] resize-none" value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} required /><div className="flex justify-end mt-4"><Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading || !newPost.title.trim() || !newPost.content.trim()}>{loading ? "Posting..." : "Post"}</Button></div></div></div></form>{error && <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3 text-sm text-yellow-700">{error}</div>}</CardContent></Card>
        <div className="space-y-6">{visiblePosts.length === 0 ? <Card><CardContent className="pt-6 text-center text-gray-500">{searchTerm ? "No posts match your search yet." : "No posts yet. Be the first to share something!"}</CardContent></Card> : visiblePosts.map((post: any) => <Card key={post._id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedPost(post)}><CardContent className="pt-6"><div className="flex space-x-3"><Avatar className="h-10 w-10"><AvatarImage src={assetUrl(post.author?.profileImage) || "/placeholder.svg"} /><AvatarFallback>{post.author?.firstName?.[0]}{post.author?.lastName?.[0]}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2 mb-2"><h4 className="font-semibold">{post.author?.firstName} {post.author?.lastName}</h4><span className="text-gray-500 text-sm">@{post.author?.username}</span><span className="text-gray-400">•</span><span className="text-gray-500 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span></div>{isOwnPost(post) && <button type="button" aria-label="Delete post" title="Delete post" disabled={deletingPostId === post._id} onClick={(e) => { e.stopPropagation(); void handleDeletePost(post._id); }} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div><h3 className="font-medium mb-2">{post.title}</h3><p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>{post.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{post.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}</div>}<div className="flex items-center space-x-6 text-gray-500"><button type="button" className="flex items-center space-x-2 hover:text-red-500" onClick={(e) => { e.stopPropagation(); void handleLike(post._id); }}><Heart className="h-4 w-4" /><span className="text-sm">{post.likes?.length || 0}</span></button><button type="button" className="flex items-center space-x-2 hover:text-blue-500" onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}><MessageCircle className="h-4 w-4" /><span className="text-sm">{post.comments?.length || 0}</span></button><button type="button" className="flex items-center space-x-2 hover:text-green-500" onClick={(e) => { e.stopPropagation(); void handleShare(post._id); }}><Share2 className="h-4 w-4" /><span className="text-sm">Share</span></button></div></div></div></CardContent></Card>)}</div></main>
      <aside className="lg:col-span-1"><Card><CardHeader><CardTitle className="text-lg">Your Activity</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-500">Real connections, projects and profile views will appear here as you use DevHeaven.</p></CardContent></Card></aside>
    </div></div>

    {selectedPost && <div className="fixed inset-0 z-[100] bg-black/50 p-4 sm:p-6 overflow-y-auto" onClick={() => setSelectedPost(null)}><div className="mx-auto mt-6 max-w-2xl" onClick={(e) => e.stopPropagation()}><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Post</CardTitle><button type="button" aria-label="Close post" onClick={() => setSelectedPost(null)} className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></CardHeader><CardContent><div className="border-b pb-5"><div className="flex items-center gap-3"><Avatar><AvatarImage src={assetUrl(selectedPost.author?.profileImage) || "/placeholder.svg"} /><AvatarFallback>{selectedPost.author?.firstName?.[0]}{selectedPost.author?.lastName?.[0]}</AvatarFallback></Avatar><div><p className="font-semibold">{selectedPost.author?.firstName} {selectedPost.author?.lastName}</p><p className="text-sm text-gray-500">@{selectedPost.author?.username}</p></div>{isOwnPost(selectedPost) && <button type="button" aria-label="Delete post" title="Delete post" onClick={() => void handleDeletePost(selectedPost._id)} className="ml-auto rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div><h2 className="mt-4 text-xl font-semibold">{selectedPost.title}</h2><p className="mt-2 whitespace-pre-wrap text-gray-800">{selectedPost.content}</p><div className="mt-4 flex gap-5 text-sm text-gray-500"><button type="button" onClick={() => void handleLike(selectedPost._id)} className="flex items-center gap-2 hover:text-red-500"><Heart className="h-4 w-4" />{selectedPost.likes?.length || 0}</button><span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />{selectedPost.comments?.length || 0}</span></div></div><div className="pt-5"><h3 className="font-semibold mb-3">Comments</h3><div className="space-y-4 max-h-80 overflow-y-auto">{selectedPost.comments?.length ? selectedPost.comments.map((comment: any) => <div key={comment._id} className="flex gap-3"><Avatar className="h-8 w-8"><AvatarImage src={assetUrl(comment.user?.profileImage) || "/placeholder.svg"} /><AvatarFallback>{comment.user?.firstName?.[0] || "U"}</AvatarFallback></Avatar><div className="flex-1 rounded-lg bg-gray-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{comment.user?.firstName} {comment.user?.lastName}</p><p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">{comment.text}</p></div>{isOwnComment(comment) && <button type="button" aria-label="Delete comment" title="Delete comment" disabled={deletingCommentId === comment._id} onClick={() => void handleDeleteComment(selectedPost._id, comment._id)} className="text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}</div></div></div>) : <p className="text-sm text-gray-500">No comments yet. Start the conversation.</p>}</div><div className="mt-5 flex gap-2"><Input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAddComment(selectedPost._id); } }} placeholder="Write a comment..." maxLength={2000} /><Button disabled={commentLoading || !commentText.trim()} onClick={() => void handleAddComment(selectedPost._id)}>{commentLoading ? "..." : "Comment"}</Button></div></div></CardContent></Card></div></div>}
  </div>;
}
