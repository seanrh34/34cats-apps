"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SignInLinkProps = {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

/** Links to /login, remembering the current page so sign-in can return here. */
export function SignInLink({ className, onClick, children }: SignInLinkProps) {
  const pathname = usePathname();
  const href = !pathname || pathname === "/" || pathname === "/login" ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
