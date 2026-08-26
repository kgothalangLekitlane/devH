"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Code2, Search, Plus, Bell } from "lucide-react";
import Link from "next/link";
import { fetchPosts, createPost, likePost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function Dashboard() {
  const { user, token, isLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  const visiblePosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post: any) => {
      const title = post.title?.toLowerCase() || "";
      const content = post.content?.toLowerCase() || "";
      const author = `${post.author?.firstName || ""} ${post.author?.lastName || ""}`.toLowerCase();
      return title.includes(term) || content.includes(term) || author.includes(term);
    });
  }, [posts, searchTerm]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) loadPosts();
  }, [user, isLoading, router]);

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load posts.");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPost.title.trim() || !newPost.content.trim()) return;
    setLoading(true);
    try {
      await createPost(newPost, token);
      setNewPost({ title: "", content: "" });
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError("Unable to create post.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!token) return;
    try {
      await likePost(postId, token);
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError("Failed to like post.");
    }
  };

  const handleQuickPost = () => {
    document.getElementById("create-post")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleComment = (postId: string) => router.push(`/messages?post=${postId}`);

  const handleShare = async (postId: string) => {
    const shareUrl = `${window.location.origin}/dashboard?post=${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setError("Share link copied to clipboard.");
    } catch {
      setError(`Copy this link: ${shareUrl}`);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div>Loading...</div></div>;
  }

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` || "U";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Code2 className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">DevHeaven</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-purple-600 font-medium" prefetch={false}>Feed</Link>
                <Link href="/projects" className="text-gray-600 hover:text-purple-600" prefetch={false}>Projects</Link>
                <Link href="/resources" className="text-gray-600 hover:text-purple-600" prefetch={false}>Resources</Link>
                <Link href="/recruiters" className="text-gray-600 hover:text-purple-600" prefetch={false}>Jobs</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search posts..." className="pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleQuickPost}><Plus className="h-4 w-4 mr-2" />Post</Button>
              <button type="button" aria-label="Toggle notifications" onClick={() => setShowNotifications((prev) => !prev)} className="text-gray-600 hover:text-purple-600"><Bell className="h-6 w-6" /></button>
              <Link href="/messages" prefetch={false}><MessageCircle className="h-6 w-6 text-gray-600 hover:text-purple-600" /></Link>
              <Link href="/profile" prefetch={false}>
                <Avatar className="h-8 w-8"><AvatarImage src={user.profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            {showNotifications && <Card className="mb-6"><CardContent className="pt-6 text-sm text-gray-600">You&apos;ll see notifications here as real activity occurs.</CardContent></Card>}
            <Card className="mb-6" id="create-post">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12"><AvatarImage src={user.profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
                  <div><h3 className="font-semibold">{user.firstName} {user.lastName}</h3><p className="text-sm text-gray-600">{user.location || "Developer"}</p></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Connections</span><span className="font-medium">0</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Projects</span><span className="font-medium">0</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Profile Views</span><span className="font-medium">0</span></div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleCreatePost}>
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10"><AvatarImage src={user.profileImage || "/placeholder.svg"} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <Input placeholder="Post title..." value={newPost.title} onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))} className="mb-3" required />
                      <Textarea placeholder="Share your thoughts, projects, or ask questions..." className="min-h-[100px] resize-none" value={newPost.content} onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))} required />
                      <div className="flex justify-end mt-4"><Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading || !newPost.title.trim() || !newPost.content.trim()}>{loading ? "Posting..." : "Post"}</Button></div>
                    </div>
                  </div>
                </form>
                {error && <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3 text-sm text-yellow-700">{error}</div>}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {visiblePosts.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-gray-500"><p>{searchTerm ? "No posts match your search yet." : "No posts yet. Be the first to share something!"}</p></CardContent></Card>
              ) : visiblePosts.map((post: any) => (
                <Card key={post._id}><CardContent className="pt-6">
                  <div className="flex space-x-3">
                    <Avatar className="h-10 w-10"><AvatarImage src={post.author?.profileImage || "/placeholder.svg"} /><AvatarFallback>{post.author?.firstName?.[0]}{post.author?.lastName?.[0]}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2"><h4 className="font-semibold">{post.author?.firstName} {post.author?.lastName}</h4><span className="text-gray-500 text-sm">@{post.author?.username}</span><span className="text-gray-400 text-sm">•</span><span className="text-gray-500 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span></div>
                      <h3 className="font-medium mb-2">{post.title}</h3><p className="text-gray-800 mb-3">{post.content}</p>
                      {post.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{post.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>)}</div>}
                      <div className="flex items-center space-x-6 text-gray-500">
                        <button className="flex items-center space-x-2 hover:text-red-500" onClick={() => handleLike(post._id)}><Heart className="h-4 w-4" /><span className="text-sm">{post.likes?.length || 0}</span></button>
                        <button className="flex items-center space-x-2 hover:text-blue-500" onClick={() => handleComment(post._id)}><MessageCircle className="h-4 w-4" /><span className="text-sm">{post.comments?.length || 0}</span></button>
                        <button className="flex items-center space-x-2 hover:text-green-500" onClick={() => handleShare(post._id)}><Share2 className="h-4 w-4" /><span className="text-sm">Share</span></button>
                      </div>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </main>

          <aside className="lg:col-span-1">
            <Card><CardHeader><CardTitle className="text-lg">Your Activity</CardTitle></CardHeader><CardContent><p className="text-sm text-gray-500">Real connections, projects and profile views will appear here as you use DevHeaven.</p></CardContent></Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
