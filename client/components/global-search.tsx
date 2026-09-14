"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  useEffect(() => {
    if (pathname === "/search") return
    setQuery("")
  }, [pathname])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) {
      router.push("/search")
      return
    }
    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <form onSubmit={submit} className="fixed left-1/2 top-3 z-[55] hidden w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 md:block">
      <div className="flex items-center rounded-xl border border-border bg-background/90 shadow-lg backdrop-blur-xl focus-within:ring-2 focus-within:ring-ring">
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people, projects, jobs..."
          aria-label="Search DevHeaven"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="mr-2 hidden rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground lg:inline-flex">
          Ctrl K
        </kbd>
      </div>
    </form>
  )
}
