"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        })
      }
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  useEffect(() => {
    setQuery("")
    setOpen(false)
  }, [pathname])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()
    setOpen(false)
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search")
  }

  // Authentication pages should stay focused on signing in or creating an account.
  if (pathname === "/search" || pathname.startsWith("/auth/") || pathname === "/login" || pathname === "/signup") {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-40">
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] lg:inline">Ctrl K</kbd>
        </button>
      ) : (
        <form onSubmit={submit} className="w-[min(420px,calc(100vw-2rem))]">
          <div className="flex items-center rounded-xl border border-border bg-background shadow-xl">
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, projects, jobs..."
              aria-label="Search DevHeaven"
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button type="button" onClick={() => setOpen(false)} className="mr-1 rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Close search">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
