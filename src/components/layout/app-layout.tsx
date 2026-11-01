import * as React from "react";
import { Sidebar, MobileHeader } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FBF9F5] text-[#1F1A17]">
      {/* Mobile top bar */}
      <MobileHeader />

      {/* Desktop Persistent Left Sidebar (~264px) */}
      <Sidebar />

      {/* Spacious Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <div className="flex-1 p-6 sm:p-8 lg:p-12 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
