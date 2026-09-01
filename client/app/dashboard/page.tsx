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
type DashboardPost = Record<string, any> & { _id: string };

export default function Dashboard() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
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
  const [selectedPost, setSelectedPost] = useState<DashboardPost | null>(null);
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
      setPosts(Array.isArray(data) ? data as DashboardPost[] : []);
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

  const updateSelectedPost = (id: string, updater: (post: DashboardPost) => DashboardPost) => {
    setPosts((current: DashboardPost[]) => current.map((post: DashboardPost) => String(post._id) === String(id) ? updater(post) : post));
    setSelectedPost((current: DashboardPost | null) => current && String(current._id) === String(id) ? updater(current) : current);
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
      if (updated) updateSelectedPost(id, () => updated as DashboardPost);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add comment.");
    } finally { setCommentLoading(false); }
  };

  const handleDeletePost = async (id: string) => {
    if (!token || !window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingPostId(id);
    try {
      await deletePost(id, token);
      setPosts((current: DashboardPost[]) => current.filter((p: DashboardPost) => String(p._id) !== String(id)));
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
      if (updated) updateSelectedPost(postId, () => updated as DashboardPost);
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

  return null;
}
