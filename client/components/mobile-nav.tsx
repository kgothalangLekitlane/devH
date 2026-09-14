"use client"

import Link from "next/link"
import { BriefcaseBusiness, Compass, FolderKanban, Home, MessageCircle } from "lucide-react"
import { usePathname } from "next/navigation"

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discovery", label: "Discover", icon: Compass },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/messages", label: "Messages", icon: MessageCircle },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-border bg-background/90 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-[10px] font-medium transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-cyan-500 dark:text-cyan-300" : ""}`} />
              <span className="mt-1">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
