"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface NotificationCenterProps {
  token: string;
  onNavigate?: (link: string) => void;
}

const iconFor = (type: string) => {
  if (type === "like") return <Heart className="h-4 w-4" />;
  if (type === "comment") return <MessageCircle className="h-4 w-4" />;
  if (type === "connection") return <UserPlus className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
};

const timeAgo = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function NotificationCenter({ token, onNavigate }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const body = await fetchNotifications(token, 30);
      setNotifications(Array.isArray(body?.notifications) ? body.notifications : []);
      setUnreadCount(Math.max(0, Number(body?.unreadCount) || 0));
    } catch (error) {
      console.error("Unable to load notifications", error);
    }
  };

  useEffect(() => {
    if (!token) return;
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [token]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleRead = async (notification: any) => {
    if (!notification.read) {
      try {
        await markNotificationRead(String(notification._id), token);
        setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, read: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Unable to mark notification read", error);
      }
    }
    if (notification.link) onNavigate?.(notification.link);
    setOpen(false);
  };

  const handleMarkAll = async () => {
    if (!unreadCount) return;
    setLoading(true);
    try {
      await markAllNotificationsRead(token);
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark notifications read", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} onClick={() => setOpen((value) => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-purple-600">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[120] w-[min(92vw,380px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div><h3 className="font-semibold text-gray-900">Notifications</h3><p className="text-xs text-gray-500">{unreadCount ? `${unreadCount} unread` : "All caught up"}</p></div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={!unreadCount || loading} onClick={handleMarkAll} title="Mark all as read"><CheckCheck className="mr-1 h-4 w-4" />Read all</Button>
              <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-500"><Bell className="mx-auto mb-2 h-7 w-7 text-gray-300" />No notifications yet.</div> : notifications.map((notification) => {
              const sender = notification.sender;
              const name = sender ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim() : "DevHeaven";
              return <button type="button" key={notification._id} onClick={() => void handleRead(notification)} className={`flex w-full gap-3 border-b px-4 py-3 text-left transition hover:bg-gray-50 ${notification.read ? "bg-white" : "bg-purple-50/70"}`}>
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.read ? "bg-gray-100 text-gray-500" : "bg-purple-100 text-purple-600"}`}>{iconFor(notification.type)}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm text-gray-800"><strong>{name}</strong>{name && " "}{notification.text}</span><span className="mt-1 flex items-center gap-1 text-xs text-gray-400">{timeAgo(notification.createdAt)} {!notification.read && <Check className="h-3 w-3 text-purple-500" />}</span></span>
              </button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
