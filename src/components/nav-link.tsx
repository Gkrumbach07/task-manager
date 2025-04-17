"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "./ui/badge";

export default function NavLink({
  href,
  badgeCount,
  children,
}: {
  href: string;
  badgeCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        isActive(href) ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
      {badgeCount && (
        <Badge className="absolute -top-2 -right-4 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {badgeCount}
        </Badge>
      )}
    </Link>
  );
}
