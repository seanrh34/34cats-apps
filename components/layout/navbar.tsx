"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { mainNavItems } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-rail bg-platform/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="34cats Apps home">
          <Image src="/34cats_main_light.png" alt="" width={240} height={120} className="theme-image-light h-10 w-auto" priority />
          <Image src="/34cats_main.png" alt="" width={240} height={120} className="theme-image-dark h-10 w-auto" priority />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {mainNavItems.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-medium text-copy-muted transition-colors hover:text-copy">
              {item.name}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="portal-button portal-button-secondary">Credits <span aria-hidden="true">↗</span></a>
          <ThemeToggle />
          {loading ? (
            <span className="px-3 text-sm text-copy-muted">Checking…</span>
          ) : user ? (
            <>
              <span className="max-w-36 truncate text-sm text-copy-muted">{user.email}</span>
              <button type="button" onClick={handleSignOut} className="portal-button portal-button-secondary">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="portal-button portal-button-primary">Sign in</Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="portal-button portal-button-secondary px-3"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-rail bg-platform-raised px-5 py-4 md:hidden">
          <div className="mx-auto max-w-6xl space-y-1">
            {mainNavItems.map((item) => (
              <Link key={item.name} href={item.href} className="block rounded-control px-3 py-3 font-medium hover:bg-surface-subtle" onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
            <div className="grid gap-2 pt-3 sm:grid-cols-2">
              <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="portal-button portal-button-secondary">Credits <span aria-hidden="true">↗</span></a>
              {loading ? (
                <span className="flex min-h-11 items-center text-sm text-copy-muted">Checking account…</span>
              ) : user ? (
                <button type="button" onClick={handleSignOut} className="portal-button portal-button-primary">Sign out</button>
              ) : (
                <Link href="/login" className="portal-button portal-button-primary" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
