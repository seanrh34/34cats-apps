"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavItems } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);

      // Section highlighting only makes sense on the homepage
      if (pathname !== "/") {
        setActiveSection(null);
        return;
      }

      let current = "home";
      for (const item of mainNavItems) {
        const id = item.href.split("#")[1];
        const el = id && document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        isScrolled
          ? "border-b border-line bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="-ml-2 flex items-center">
            <Image
              src="/34cats_main.png"
              alt="34cats"
              width={240}
              height={120}
              className="h-11 w-auto"
            />
          </Link>

          <div className="hidden md:flex md:items-center md:gap-9">
            {mainNavItems.map((item) => {
              const isActive = activeSection === item.href.split("#")[1];
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "label text-ash transition-colors hover:text-bone",
                    isActive && "text-ember hover:text-ember"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {loading ? (
              <span className="label text-ash-dim">···</span>
            ) : user ? (
              <>
                <span className="max-w-[180px] truncate text-sm text-ash">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-line-strong px-4 py-1.5 text-sm font-medium text-bone transition-colors hover:border-ash-dim hover:bg-ink-raised"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-ember-deep px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ember"
              >
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            className="-mr-2 inline-flex items-center justify-center rounded-lg p-2 text-ash transition-colors hover:text-bone md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Toggle menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                }
              />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-line bg-ink pb-4 md:hidden">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block border-b border-line py-4 font-display text-2xl text-bone"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-4">
              {loading ? (
                <span className="label text-ash-dim">···</span>
              ) : user ? (
                <>
                  <p className="truncate text-sm text-ash">{user.email}</p>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-3 w-full rounded-full border border-line-strong px-4 py-2.5 text-sm font-medium text-bone"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block w-full rounded-full bg-ember-deep px-4 py-2.5 text-center text-sm font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
