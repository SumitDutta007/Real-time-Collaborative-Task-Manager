"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Task, Project } from "@/types";
import { taskApi, projectApi } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { syncBackendToken } from "@/lib/syncToken";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateProjectModal from "@/components/CreateProjectModal";
import Sidebar from "@/components/Sidebar";

const priorityDot: Record<string, string> = {
  HIGH: "bg-red-500",
  NORMAL: "bg-yellow-400",
  LOW: "bg-green-400",
};

const priorityBorder: Record<string, string> = {
  HIGH: "border-l-red-500",
  NORMAL: "border-l-yellow-400",
  LOW: "border-l-green-400",
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const statusLabel: Record<string, string> = {
  PENDING: "In Progress",
  COMPLETED: "Completed",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [filter, setFilter] = useState<"all" | "PENDING" | "COMPLETED">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | "all">("all");
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<{ email: string; name: string }[]>([]);
  const [tokenReady, setTokenReady] = useState(false);

  const syncToken = useCallback(async () => {
    if (!session?.user) return;
    await syncBackendToken({
      email: session.user.email!,
      name: session.user.name!,
      image: session.user.image,
    });
    setTokenReady(true);
  }, [session]);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        taskApi.getAll('team'),
        projectApi.getAll(),
      ]);
      setTasks(tasksRes.data.data.tasks);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) syncToken();
  }, [session, syncToken]);

  useEffect(() => {
    if (!session || !tokenReady) return;
    fetchData();
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);

    // Define named handlers so cleanup removes only this cycle's listeners
    const onTaskCreated = (d: { task: Task }) => {
      setTasks((p) => [d.task, ...p]);
    };
    const onTaskUpdated = (d: { task: Task }) =>
      setTasks((p) => p.map((t) => t.id === d.task.id ? d.task : t));
    const onTaskDeleted = (d: { taskId: string }) =>
      setTasks((p) => p.filter((t) => t.id !== d.taskId));
    const onTaskStatusUpdated = (d: { task: Task }) =>
      setTasks((p) => p.map((t) => t.id === d.task.id ? d.task : t));
    const onUsersOnline = (users: { email: string; name: string }[]) =>
      setOnlineUsers(users);
    const onConnect = () => socket.emit("users:request");

    socket.on("task:created", onTaskCreated);
    socket.on("task:updated", onTaskUpdated);
    socket.on("task:deleted", onTaskDeleted);
    socket.on("task:status:updated", onTaskStatusUpdated);
    socket.on("users:online", onUsersOnline);
    socket.on("connect", onConnect);

    if (socket.connected) {
      socket.emit("users:request");
    }

    return () => {
      // Only remove THIS effect's listeners — never disconnect.
      // The socket singleton stays alive across StrictMode remounts.
      // disconnectSocket() is called only at logout (see signOut handler below).
      socket.off("task:created", onTaskCreated);
      socket.off("task:updated", onTaskUpdated);
      socket.off("task:deleted", onTaskDeleted);
      socket.off("task:status:updated", onTaskStatusUpdated);
      socket.off("users:online", onUsersOnline);
      socket.off("connect", onConnect);
    };
  }, [session, tokenReady, fetchData]);

  const handleStatusToggle = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await taskApi.updateStatus(taskId, newStatus);
    setTasks((p) => p.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDelete = async (taskId: string) => {
    await taskApi.delete(taskId);
    setTasks((p) => p.filter((t) => t.id !== taskId));
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
    </div>
  );
  if (!session) return null;

  const filteredTasks = tasks.filter((t) => {
    const statusMatch = filter === "all" || t.status === filter;
    const projectMatch = selectedProjectId === "all" || t.projectId === selectedProjectId;
    return statusMatch && projectMatch;
  });

  // Group ALL projects — filter to selected project when one is chosen
  const projectGroups = projects
    .filter((p) => selectedProjectId === "all" || p.id === selectedProjectId)
    .map((project) => ({
      project,
      tasks: filteredTasks.filter((t) => t.projectId === project.id),
      // all tasks for this project regardless of filter (used for progress calc)
      allTasks: tasks.filter((t) => t.projectId === project.id),
    }));

  // Tasks with no project (shouldn't happen but safety net)
  const ungroupedTasks = filteredTasks.filter(
    (t) => !projects.some((p) => p.id === t.projectId)
  );

  const toggleCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const favoriteProjects = projects.filter((p) => p.favorite);
  void favoriteProjects;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        session={session}
        projects={projects}
        tasks={tasks}
        onProjectFilter={(id) => setSelectedProjectId(id)}
        activeProjectId={selectedProjectId}
      />

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-14">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Task Board</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400">{filteredTasks.length} tasks</p>
              {/* Live online indicator */}
              {onlineUsers.length > 0 && (
                <div className="flex items-center gap-1.5 group relative">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    {onlineUsers.length} online
                  </span>
                  {/* Tooltip with names */}
                  <div className="absolute left-0 top-5 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl min-w-36 whitespace-nowrap">
                    <p className="font-semibold text-gray-300 mb-1">Online now</p>
                    {onlineUsers.map((u) => (
                      <p key={u.email} className="text-gray-200 truncate">• {u.name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(["all", "PENDING", "COMPLETED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === f ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "All" : f === "PENDING" ? "In Progress" : "Done"}
                </button>
              ))}
            </div>
            {/* Project filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none max-w-32"
            >
              <option value="all">All Projects</option>
              {projects.filter((p) => p.id).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {/* New Project button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateProject(true)}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="text-base leading-none">⊞</span>
              <span className="hidden sm:inline">New Project</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Add Task</span>
            </motion.button>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-gray-200" />

            {/* User avatar + logout — desktop only (sidebar handles mobile) */}
            <div className="hidden lg:flex items-center gap-2">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  {session.user?.name?.[0]}
                </div>
              )}
              <span className="text-sm text-gray-600 max-w-28 truncate hidden xl:block">
                {session.user?.name}
              </span>
              <button
                onClick={() => { disconnectSocket(); signOut({ callbackUrl: "/" }); }}
                title="Sign out"
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-10 bg-gray-50 rounded" />
                  <div className="h-10 bg-gray-50 rounded" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">⊞</div>
              <p className="font-medium">No projects yet</p>
              <p className="text-sm mt-1">Click &quot;New Project&quot; to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Per-project sections ── */}
              {projectGroups.map(({ project, tasks: projectTasks, allTasks: projectAllTasks }) => {
                const collapsed = collapsedProjects.has(project.id);
                const completedCount = projectAllTasks.filter((t) => t.status === "COMPLETED").length;
                const progress = projectAllTasks.length > 0
                  ? Math.round((completedCount / projectAllTasks.length) * 100)
                  : 0;

                return (
                  <div key={project.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Project header row */}
                    <button
                      onClick={() => toggleCollapse(project.id)}
                      className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Color bar */}
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      {/* Name */}
                      <span className="font-semibold text-gray-800 text-sm flex-1 text-left truncate">
                        {project.name}
                      </span>
                      {/* Stats */}
                      <span className="text-xs text-gray-400 shrink-0">
                        {projectAllTasks.length === 0
                          ? "No tasks"
                          : `${completedCount}/${projectAllTasks.length} done`}
                      </span>
                      {/* Mini progress bar — only when tasks exist */}
                      {projectAllTasks.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 w-24 shrink-0">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%`, backgroundColor: project.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-7 text-right">{progress}%</span>
                        </div>
                      )}
                      {/* Chevron */}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${collapsed ? "-rotate-90" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Tasks — hidden when collapsed */}
                    {!collapsed && (
                      <div>
                        {/* Empty state — no tasks at all in this project */}
                        {projectAllTasks.length === 0 && (
                          <div className="flex items-center gap-3 px-6 py-5 text-gray-400">
                            <span className="text-lg">📋</span>
                            <span className="text-sm">No tasks yet.</span>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="ml-1 text-green-500 hover:text-green-600 text-sm font-medium underline underline-offset-2 transition-colors"
                            >
                              Add the first task →
                            </button>
                          </div>
                        )}

                        {/* Filter empty state — tasks exist but none match current filter */}
                        {projectAllTasks.length > 0 && projectTasks.length === 0 && (
                          <div className="px-6 py-4 text-xs text-gray-400 italic">
                            No tasks match the current filter.
                          </div>
                        )}

                        {/* Desktop table (xl+) */}
                        {projectTasks.length > 0 && (
                        <div className="hidden xl:block">
                          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr_auto] gap-4 px-6 py-2 bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            <span>Task</span>
                            <span>Due Date</span>
                            <span>Status</span>
                            <span>Priority</span>
                            <span>Progress</span>
                            <span>Assignee</span>
                            <span />
                          </div>
                          <div className="divide-y divide-gray-50">
                            {projectTasks.map((task) => (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-gray-50 transition-colors group"
                              >
                                {/* Title */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <button
                                    onClick={() => handleStatusToggle(task.id)}
                                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                      task.status === "COMPLETED"
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-green-400"
                                    }`}
                                  >
                                    {task.status === "COMPLETED" && (
                                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                                        <path d="M1 5l3 3 5-5" strokeWidth="1.5" strokeLinecap="round" />
                                      </svg>
                                    )}
                                  </button>
                                  <span className={`text-sm font-medium truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                    {task.title}
                                  </span>
                                </div>
                                {/* Due date */}
                                <span className="text-xs text-gray-500">
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                                    : <span className="text-gray-300">—</span>}
                                </span>
                                {/* Status */}
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${statusStyle[task.status]}`}>
                                  {statusLabel[task.status]}
                                </span>
                                {/* Priority */}
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
                                  <span className="text-xs text-gray-500 capitalize">{task.priority.toLowerCase()}</span>
                                </div>
                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                    <div
                                      className="h-1.5 rounded-full bg-green-400 transition-all"
                                      style={{ width: `${task.status === "COMPLETED" ? 100 : task.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 w-7 text-right">
                                    {task.status === "COMPLETED" ? 100 : task.progress}%
                                  </span>
                                </div>
                                {/* Assignee */}
                                <div className="min-w-0">
                                  {task.assignee ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {task.assignee.image ? (
                                        <Image
                                          src={task.assignee.image}
                                          alt={task.assignee.name}
                                          width={20}
                                          height={20}
                                          className="rounded-full shrink-0"
                                        />
                                      ) : (
                                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                                          {task.assignee.name?.[0]?.toUpperCase() ?? "?"}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500 truncate">{task.assignee.email}</span>
                                    </div>
                                  ) : task.pendingAssigneeEmail ? (
                                    <span className="text-xs text-amber-500 truncate italic" title="Invitation pending">
                                      {task.pendingAssigneeEmail}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </div>
                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        )}

                        {/* Mobile/Tablet card grid (< xl) */}
                        {projectTasks.length > 0 && (
                        <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4">
                          {projectTasks.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`bg-gray-50 rounded-xl border-l-4 ${priorityBorder[task.priority]} p-4`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <button
                                  onClick={() => handleStatusToggle(task.id)}
                                  className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                    task.status === "COMPLETED"
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300 hover:border-green-400"
                                  }`}
                                >
                                  {task.status === "COMPLETED" && (
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                                      <path d="M1 5l3 3 5-5" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold leading-tight ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[task.status]}`}>
                                  {statusLabel[task.status]}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                                  {task.priority.toLowerCase()}
                                </span>
                                {task.dueDate && (
                                  <span className="text-xs text-gray-400">
                                    Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                                {/* Assignee */}
                                {(task.assignee || task.pendingAssigneeEmail) && (
                                  <span className="inline-flex items-center gap-1 text-xs">
                                    {task.assignee ? (
                                      <>
                                        {task.assignee.image ? (
                                          <Image src={task.assignee.image} alt={task.assignee.name} width={14} height={14} className="rounded-full" />
                                        ) : (
                                          <span className="w-3.5 h-3.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold flex items-center justify-center">
                                            {task.assignee.name?.[0]?.toUpperCase() ?? "?"}
                                          </span>
                                        )}
                                        <span className="text-gray-500 truncate max-w-30">{task.assignee.email}</span>
                                      </>
                                    ) : (
                                      <span className="text-amber-500 italic truncate max-w-30">{task.pendingAssigneeEmail}</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full bg-green-400 transition-all"
                                    style={{ width: `${task.status === "COMPLETED" ? 100 : task.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">
                                  {task.status === "COMPLETED" ? 100 : task.progress}%
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped tasks (safety net) */}
              {ungroupedTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-gray-100">
                    <span className="w-3 h-3 rounded-sm bg-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800 text-sm flex-1">Other Tasks</span>
                    <span className="text-xs text-gray-400">{ungroupedTasks.length} tasks</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {ungroupedTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 group">
                        <button
                          onClick={() => handleStatusToggle(task.id)}
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            task.status === "COMPLETED" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                          }`}
                        >
                          {task.status === "COMPLETED" && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor">
                              <path d="M1 5l3 3 5-5" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>
                        <span className={`text-sm flex-1 truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreateProject={() => setShowCreateProject(true)}
          onCreated={() => {
            // Do NOT add task to state here — the socket's task:created event
            // is the single source of truth and will add it automatically.
            setShowCreateModal(false);
          }}
        />
      )}

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={(p) => {
            setProjects((prev) => [p, ...prev]);
          }}
        />
      )}
    </div>
  );
}
