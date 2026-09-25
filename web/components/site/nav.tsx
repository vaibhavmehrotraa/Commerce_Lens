"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LineChart } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LineChart className="h-5 w-5" style={{ color: "var(--series-1)" }} />
          <span>CommerceLens</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="group relative">
              <button className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {group.title}
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-[240px] rounded-lg border border-border bg-popover p-1.5 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground/90"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          className="rounded-md p-2 hover:bg-secondary lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="max-h-[75vh] overflow-y-auto border-t border-border bg-background px-4 py-3 lg:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <div className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-2 py-2 text-sm",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground/90 hover:bg-secondary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
