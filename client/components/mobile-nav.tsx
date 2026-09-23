"use client"

import Link from "next/link"
import { BriefcaseBusiness, Compass, FolderKanban, Home, MessageCircle, Settings } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { fetchUnreadMessageCount } from "@/lib/api"

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discovery", label: "Discover", icon: Compass },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const { token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0)
      return
    }

    try {
      const body = await fetchUnreadMessageCount(token)
      const count = Number(body?.count ?? body?.unreadCount ?? 0)
      setUnreadCount(Number.isFinite(count) && count > 0 ? count : 0)
    } catch {
      // Keep navigation usable if the unread-count request fails.
    }
  }, [token])

  useEffect(() => {
    void loadUnreadCount()
    const interval = window.setInterval(() => void loadUnreadCount(), 15000)
    return () => window.clearInterval(interval)
  }, [loadUnreadCount])

  useEffect(() => {
    const handleMessageUpdate = () => void loadUnreadCount()
    window.addEventListener("devheaven:messages-updated", handleMessageUpdate)
    return () => window.removeEventListener("devheaven:messages-updated", handleMessageUpdate)
  }, [loadUnreadCount])

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-border bg-background/90 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
          const showBadge = href === "/messages" && unreadCount > 0
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={showBadge ? `${label}, ${unreadCount} unread` : label}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-medium transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}
            >
              <span className="relative inline-flex">
                <Icon className={`h-5 w-5 ${active ? "text-cyan-500 dark:text-cyan-300" : ""}`} />
                {showBadge && (
                  <span className="absolute -right-3 -top-3 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="mt-1">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
