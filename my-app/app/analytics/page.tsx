"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { analyticsApi, taskApi, projectApi } from "@/lib/api";
import { syncBackendToken } from "@/lib/syncToken";
import Sidebar from "@/components/Sidebar";
import { Task, Project } from "@/types";

interface Stats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalProjects: number;
  completionRate: number;
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [byStatus, setByStatus] = useState<{ status: string; count: number }[]>([]);
  const [byPriority, setByPriority] = useState<{ priority: string; count: number }[]>([]);
  const [byProject, setByProject] = useState<{ projectName: string; total: number; completed: number }[]>([]);
  const [trend, setTrend] = useState<{ date: string; completed: number }[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchAnalytics = useCallback(async () => {
    try {
      const [statsRes, statusRes, priorityRes, projectRes, trendRes, tasksRes, projectsRes] =
        await Promise.all([
          analyticsApi.getStats(),
          analyticsApi.getTasksByStatus(),
          analyticsApi.getTasksByPriority(),
          analyticsApi.getTasksByProject(),
          analyticsApi.getCompletionTrend(30),
          taskApi.getAll(),
          projectApi.getAll(),
        ]);

      setStats(statsRes.data.data ?? statsRes.data);
      setAllTasks(tasksRes.data.data?.tasks ?? []);
      setAllProjects(projectsRes.data ?? []);

      const rawStatus = statusRes.data.data ?? statusRes.data;
      setByStatus(
        Array.isArray(rawStatus)
          ? rawStatus
          : Object.entries(rawStatus).map(([s, c]) => ({ status: s, count: c as number }))
      );

      const rawPriority = priorityRes.data.data ?? priorityRes.data;
      setByPriority(
        Array.isArray(rawPriority)
          ? rawPriority
          : Object.entries(rawPriority).map(([p, c]) => ({ priority: p, count: c as number }))
      );

      const rawProject = projectRes.data.data ?? projectRes.data;
      setByProject(Array.isArray(rawProject) ? rawProject : []);

      const rawTrend = trendRes.data.data ?? trendRes.data;
      setTrend(Array.isArray(rawTrend) ? rawTrend : []);
    } catch (e) {
      console.error("Analytics fetch failed", e);
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
    if (session && tokenReady) fetchAnalytics();
  }, [session, tokenReady, fetchAnalytics]);

  if (status === "loading" || !session) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar session={session} projects={allProjects} tasks={allTasks} />

      <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-14">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <h1 className="text-lg font-bold text-gray-800">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Overview of your team&apos;s task performance</p>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-28" />)}
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[
                  { label: "Total Tasks", value: stats?.totalTasks ?? 0, color: "border-blue-500", text: "text-blue-600" },
                  { label: "Completed", value: stats?.completedTasks ?? 0, color: "border-green-500", text: "text-green-600" },
                  { label: "Pending", value: stats?.pendingTasks ?? 0, color: "border-yellow-500", text: "text-yellow-600" },
                  { label: "Projects", value: stats?.totalProjects ?? 0, color: "border-purple-500", text: "text-purple-600" },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border-l-4 ${s.color}`}
                  >
                    <p className="text-xs sm:text-sm text-gray-500">{s.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Completion rate bar */}
              {stats && (
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">Overall Completion Rate</h2>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{Math.round(stats.completionRate ?? 0)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionRate ?? 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-3 rounded-full bg-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Tasks by Status — Pie */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Tasks by Status</h2>
                  {byStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={byStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {byStatus.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <span className="text-3xl mb-2">📊</span>
                      <p className="text-sm">No data yet — create some tasks</p>
                    </div>
                  )}
                </div>

                {/* Tasks by Priority — Bar */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Tasks by Priority</h2>
                  {byPriority.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={byPriority} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {byPriority.map((entry, i) => {
                            const c = entry.priority === "HIGH" ? "#EF4444" : entry.priority === "LOW" ? "#10B981" : "#F59E0B";
                            return <Cell key={i} fill={c} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <span className="text-3xl mb-2">📊</span>
                      <p className="text-sm">No data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Completion Trend — Line */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Completion Trend (Last 30 Days)</h2>
                {trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                      <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <span className="text-3xl mb-2">📈</span>
                    <p className="text-sm">No trend data yet — complete some tasks to see the chart</p>
                  </div>
                )}
              </div>

              {/* Tasks per Project — Bar */}
              {byProject.length > 0 && (
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4">Tasks per Project</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byProject} margin={{ top: 5, right: 20, left: 0, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="projectName" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
