"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { mainNavItems } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-6">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-6xl items-center gap-4 rounded-full border border-rail bg-platform/80 py-1.5 pl-5 pr-2 backdrop-blur-md transition-shadow duration-300 md:gap-6 md:pr-2.5 ${
          scrolled ? "shadow-[0_10px_30px_-10px_rgba(28,25,21,0.35)]" : "shadow-[0_2px_8px_-4px_rgba(28,25,21,0.2)]"
        }`}
      >
        <Link href="/" className="-my-3 flex shrink-0 items-center" aria-label="34cats Apps home">
          <Image src="/34cats_main_light.png" alt="" width={240} height={120} className="theme-image-light h-16 w-auto" priority />
          <Image src="/34cats_main.png" alt="" width={240} height={120} className="theme-image-dark h-16 w-auto" priority />
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {mainNavItems.map((item) => (
            <Link key={item.name} href={item.href} className="nav-link text-sm font-medium text-copy">
              {item.name}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="nav-link text-sm font-medium text-copy">
            Credits <span aria-hidden="true" className="ml-1">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <ThemeToggle />
          {loading ? (
            <span className="px-3 text-sm text-copy-muted">Checking…</span>
          ) : user ? (
            <>
              <span className="max-w-36 truncate text-sm text-copy-muted">{user.email}</span>
              <button type="button" onClick={handleSignOut} className="portal-button portal-button-secondary rounded-full">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="portal-button portal-button-primary rounded-full">Sign in</Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            ref={menuButton}
            type="button"
            className="portal-button portal-button-secondary rounded-full px-4"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="absolute inset-x-3 top-full mt-2 overflow-hidden rounded-[1.75rem] border border-rail bg-platform-raised p-3 shadow-[0_18px_40px_-14px_rgba(28,25,21,0.45)] md:hidden"
        >
          <div className="space-y-1">
            {mainNavItems.map((item, i) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-menu-item portal-heading block rounded-control px-4 py-3 text-2xl hover:bg-surface-subtle"
                style={{ "--i": i } as CSSProperties}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="nav-menu-item grid gap-2 pt-2 sm:grid-cols-2" style={{ "--i": mainNavItems.length } as CSSProperties}>
              <a href="https://credits.34cats.com" target="_blank" rel="noopener noreferrer" className="portal-button portal-button-secondary">
                Credits <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
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
    </header>
  );
}
