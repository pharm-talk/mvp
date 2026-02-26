"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BriefcaseMedical,
  MessagesSquare,
  MapPin,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "홈", href: "/" },
  { icon: BriefcaseMedical, label: "약 서랍", href: "/medications" },
  { icon: MapPin, label: "약국", href: "/pharmacy" },
  { icon: MessagesSquare, label: "상담", href: "/consultations" },
  { icon: User, label: "MY", href: "/my" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom"
      role="navigation"
      aria-label="주요 메뉴"
    >
      <div className="flex items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[3rem]"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={`w-[1.4rem] h-[1.4rem] transition-colors duration-150 ${
                  isActive ? "text-brand" : "text-gray-300"
                }`}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <span
                className={`text-[0.625rem] font-semibold transition-colors duration-150 ${
                  isActive ? "text-brand" : "text-gray-300"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
