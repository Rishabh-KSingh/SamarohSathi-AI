"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarHeart,
  PieChart,
  CalendarCheck,
  Store,
  Sparkles,
  Settings,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

export const navigationItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles, badge: "AI" },
  { name: "My Events", href: "/events", icon: CalendarHeart },
  { name: "Budget Planner", href: "/budget", icon: PieChart },
  { name: "Timeline & Tasks", href: "/timeline", icon: CalendarCheck },
  { name: "Vendors", href: "/vendors", icon: Store },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

export function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#F5F2EB] text-[#1F1A17]">
      {/* Brand Header */}
      <div className="p-6 pb-6 border-b border-[#EBE5DC]">
        <Link
          href="/"
          onClick={onItemClick}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B1D2E] rounded-lg p-0.5"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1F1A17]">
              SamarohSathi
            </span>
            <span className="w-2 h-2 rounded-full bg-[#C8963E] inline-block animate-pulse" />
          </div>
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6B635B] mt-0.5">
            AI Event Planner
          </p>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#544E47]">
            Navigation
          </p>
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B1D2E]",
                isActive
                  ? "bg-[#5B1D2E] text-white shadow-sm"
                  : "text-[#544E47] hover:text-[#1F1A17] hover:bg-[#EBE5DC]/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-[#544E47] group-hover:text-[#1F1A17]"
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                <span className="font-medium text-[14px]">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md",
                    isActive
                      ? "bg-[#C8963E] text-[#1F1A17]"
                      : "bg-[#EBE5DC] text-[#544E47]"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Active subtle indicator bar */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-[#C8963E] rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Branding Note */}
      <div className="p-3.5 mx-3 mb-4 rounded-xl bg-white/80 border border-[#EBE5DC] text-xs text-[#544E47] space-y-0.5">
        <p className="font-semibold text-[#1F1A17]">SamarohSathi AI</p>
        <p className="text-xs text-[#544E47]">Personal Celebration Advisor</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[264px] shrink-0 min-h-screen border-r border-[#EBE5DC] sticky top-0 h-screen z-30">
      <SidebarContent />
    </aside>
  );
}

export function MobileHeader() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#F5F2EB] border-b border-[#EBE5DC] sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-1.5">
        <span className="font-serif text-xl font-bold tracking-tight text-[#1F1A17]">
          SamarohSathi
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8963E]" />
      </Link>

      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className="p-2 rounded-xl text-[#1F1A17] hover:bg-[#EBE5DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B1D2E]"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[280px] max-w-[85vw] h-full bg-[#F5F2EB] shadow-xl flex flex-col relative animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 p-2 rounded-xl text-[#6B635B] hover:text-[#1F1A17] hover:bg-[#EBE5DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B1D2E]"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onItemClick={() => setIsOpen(false)} />
          </div>
          <div className="flex-1" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </header>
  );
}
