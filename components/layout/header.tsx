import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-6xl">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-white">34cats Apps</span>
        </Link>
        
        <nav className="flex items-center space-x-6">
          <Link
            href="/#apps"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-[#E84A3A]"
          >
            Apps
          </Link>
          <Link
            href="/#about"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-[#E84A3A]"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
