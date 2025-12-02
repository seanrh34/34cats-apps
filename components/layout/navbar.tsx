"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { mainNavItems } from "@/config/navigation";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      let current = "home";
      
      // Check each section to see if it's in view
      for (const item of mainNavItems) {
        if (item.href.includes('#')) {
          const id = item.href.split('#')[1];
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Check if the section is in the viewport (top of section is above middle of screen)
            if (rect.top <= 150) {
              current = id;
            }
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    console.log("Active Section:", activeSection);
  }, [activeSection]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    // Extract the hash from the href (e.g., "/#apps" -> "apps")
    const hash = href.includes('#') ? href.split('#')[1] : '';
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        const navbarHeight = 64; // h-16 = 64px
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/"
            className="flex items-center space-x-2 group">
            <Image src="/34cats_main.png" alt="34cats Apps Logo" width={120} height={120} className="w-auto h-12" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {mainNavItems.map((item) => {
              const sectionId = item.href.split('#')[1];
              const isItemActive = activeSection === sectionId;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[#E84A3A] relative inline-block cursor-pointer",
                    isItemActive ? "text-[#E84A3A]" : "text-gray-300"
                  )}
                >
                  <span className="relative inline-block py-2">
                    {item.name}
                    {isItemActive && (
                      <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[#E84A3A] rounded-full" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <Link
              href="/#apps"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#E84A3A] rounded-lg hover:bg-[#d43d2d] transition-all shadow-md hover:shadow-lg hover:shadow-[#E84A3A]/20"
            >
              Explore Apps
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {!mobileMenuOpen ? (
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            ) : (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-base font-medium transition-colors",
                    activeSection === item.href.substring(1)
                      ? "text-[#E84A3A] bg-gray-800"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/#apps"
                className="block px-3 py-2 mt-2 text-center text-sm font-semibold text-white bg-[#E84A3A] rounded-lg hover:bg-[#d43d2d] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore Apps
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
