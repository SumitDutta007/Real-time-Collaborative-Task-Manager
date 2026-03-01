"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";
import type { Project, Task } from "@/types";

interface SidebarProps {
  session: Session;
  projects?: Project[];
  tasks?: Task[];
  onProjectFilter?: (id: string | "all") => void;
  activeProjectId?: string | "all";
}

const navLinks = [
  { href: "/dashboard", label: "Task Board", icon: "✓" },
  { href: "/projects", label: "Projects", icon: "⊞" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

export default function Sidebar({
  session,
  projects = [],
  tasks = [],
  onProjectFilter,
  activeProjectId = "all",
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const myEmail = session.user?.email;

  const assignedToMe = tasks.filter(
    (t) =>
      t.assignee?.email === myEmail ||
      t.pendingAssigneeEmail === myEmail
  ).length;

  const createdByMe = tasks.filter(
    (t) => t.creator?.email === myEmail
  ).length;

  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const favoriteProjects = projects.filter((p) => p.favorite);

  const sidebarContent = (
    <aside className="w-60 bg-gray-900 text-gray-300 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-800 shrink-0">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
          T
        </div>
        <span className="font-bold text-white text-lg">TaskFlow</span>
      </div>

      {/* User */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-800 shrink-0">
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={32}
            height={32}
            className="rounded-full shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {session.user?.name?.[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {session.user?.name}
          </p>
          <p className="text-gray-400 text-xs truncate">{session.user?.email}</p>
        </div>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto">
        {/* Nav Links */}
        <nav className="px-3 py-4">
          <p className="text-gray-500 text-xs font-semibold uppercase px-2 mb-2 tracking-wider">
            Menu
          </p>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  isActive
                    ? "bg-green-500/20 text-green-400 font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base w-5 text-center">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* My Tasks Stats */}
        {tasks.length > 0 && (
          <div className="px-3 pb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase px-2 mb-2 tracking-wider">
              My Tasks
            </p>
            <div className="space-y-1">
              {[
                { label: "Assigned to me", count: assignedToMe, icon: "👤" },
                { label: "Created by me", count: createdByMe, icon: "✏️" },
                { label: "Pending", count: pending, icon: "⏳" },
                { label: "Completed", count: completed, icon: "✅" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Projects */}
        {favoriteProjects.length > 0 && (
          <div className="px-3 pb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase px-2 mb-2 tracking-wider">
              Favorites
            </p>
            {favoriteProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProjectFilter?.(
                    p.id === activeProjectId ? "all" : p.id
                  );
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  activeProjectId === p.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* All Projects list */}
        {projects.length > 0 && (
          <div className="px-3 pb-4">
            <p className="text-gray-500 text-xs font-semibold uppercase px-2 mb-2 tracking-wider">
              Projects
            </p>
            {projects.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProjectFilter?.(
                    p.id === activeProjectId ? "all" : p.id
                  );
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  activeProjectId === p.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate flex-1 text-left">{p.name}</span>
                <span className="text-xs text-gray-600">
                  {p._count?.tasks ?? 0}
                </span>
              </button>
            ))}
            {projects.length > 6 && (
              <Link
                href="/projects"
                className="block px-3 py-1 text-xs text-gray-500 hover:text-green-400 transition-colors"
              >
                +{projects.length - 6} more →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="px-3 pb-4 shrink-0 border-t border-gray-800 pt-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <span>⎋</span> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            T
          </div>
          <span className="font-bold text-white">TaskFlow</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white p-1"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-40 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>
    </>
  );
}
