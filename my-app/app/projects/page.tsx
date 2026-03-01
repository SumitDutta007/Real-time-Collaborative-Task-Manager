"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Project, Task } from "@/types";
import { projectApi, taskApi } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { syncBackendToken } from "@/lib/syncToken";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateProjectModal from "@/components/CreateProjectModal";

const statusStyle: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const priorityDot: Record<string, string> = {
  HIGH: "bg-red-500",
  NORMAL: "bg-yellow-400",
  LOW: "bg-green-400",
};

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
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
      const [pRes, tRes] = await Promise.all([
        projectApi.getAll(),
        taskApi.getAll(),
      ]);
      setProjects(pRes.data);
      setAllTasks(tRes.data.data.tasks);
      setExpandedProjects(new Set(pRes.data.map((p: Project) => p.id)));
    } catch (e) {
      console.error(e);
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
    if (token) {
      const socket = connectSocket(token);
      socket.on("task:created", (d: { task: Task }) => setAllTasks((p) => [d.task, ...p]));
      socket.on("task:updated", (d: { task: Task }) => setAllTasks((p) => p.map((t) => t.id === d.task.id ? d.task : t)));
      socket.on("task:deleted", (d: { taskId: string }) => setAllTasks((p) => p.filter((t) => t.id !== d.taskId)));
      socket.on("task:status:updated", (d: { task: Task }) => setAllTasks((p) => p.map((t) => t.id === d.task.id ? d.task : t)));
      return () => { disconnectSocket(); };
    }
  }, [session, tokenReady, fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await projectApi.delete(id);
      setProjects((p) => p.filter((proj) => proj.id !== id));
      setAllTasks((t) => t.filter((task) => task.projectId !== id));
    } catch (e) { console.error(e); }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await projectApi.toggleFavorite(id);
      setProjects((p) => p.map((proj) => proj.id === id ? { ...proj, favorite: !proj.favorite } : proj));
    } catch (e) { console.error(e); }
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
    </div>
  );
  if (!session) return null;

  const sortedProjects = [...projects].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar session={session} projects={projects} tasks={allTasks} />

      <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-14">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Projects</h1>
            <p className="text-xs text-gray-400">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateProject(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">New Project</span>
          </motion.button>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-20" />)}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🗂️</div>
              <p className="text-xl font-medium">No projects yet</p>
              <p className="text-sm mt-2">Create a project to start organizing your tasks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProjects.map((project) => {
                const projectTasks = allTasks.filter((t) => t.projectId === project.id);
                const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
                const isExpanded = expandedProjects.has(project.id);

                return (
                  <motion.div key={project.id} layout className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Project header */}
                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                      <div className="w-1 sm:w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{project.name}</h2>
                          {project.favorite && <span className="text-yellow-400 text-sm">★</span>}
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-auto sm:ml-0">
                            {projectTasks.length} task{projectTasks.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{completed}/{projectTasks.length}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <button onClick={() => handleToggleFavorite(project.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-yellow-400 transition-colors" title="Toggle favorite">
                          {project.favorite ? "★" : "☆"}
                        </button>
                        <button onClick={() => { setSelectedProjectId(project.id); setShowCreateTask(true); }} className="p-1.5 sm:p-2 rounded-lg hover:bg-green-50 text-green-500 transition-colors font-bold" title="Add task">
                          +
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors text-sm" title="Delete">
                          🗑
                        </button>
                        <button onClick={() => toggleExpand(project.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100"
                        >
                          {projectTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              No tasks yet.{" "}
                              <button onClick={() => { setSelectedProjectId(project.id); setShowCreateTask(true); }} className="text-green-500 hover:underline">
                                Add one
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Desktop table */}
                              <div className="hidden md:block">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                  <span>Task</span><span>Status</span><span>Priority</span><span>Progress</span><span></span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                  {projectTasks.map((task) => (
                                    <div key={task.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 items-center hover:bg-gray-50 transition-colors group">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <button
                                          onClick={async () => {
                                            const s = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
                                            await taskApi.updateStatus(task.id, s);
                                            setAllTasks((p) => p.map((x) => x.id === task.id ? { ...x, status: s } : x));
                                          }}
                                          className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${task.status === "COMPLETED" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                                        />
                                        <span className={`text-sm truncate ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-700"}`}>{task.title}</span>
                                      </div>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${statusStyle[task.status]}`}>
                                        {task.status === "PENDING" ? "In Progress" : "Done"}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} />
                                        <span className="text-xs text-gray-400 capitalize">{task.priority.toLowerCase()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                          <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${task.status === "COMPLETED" ? 100 : task.progress}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-7">{task.status === "COMPLETED" ? 100 : task.progress}%</span>
                                      </div>
                                      <button
                                        onClick={async () => { await taskApi.delete(task.id); setAllTasks((p) => p.filter((x) => x.id !== task.id)); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Mobile cards */}
                              <div className="md:hidden p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {projectTasks.map((task) => (
                                  <div key={task.id} className="bg-gray-50 rounded-xl p-3 border-l-4" style={{ borderLeftColor: project.color }}>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <p className={`text-sm font-medium leading-tight ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</p>
                                      <button onClick={async () => { await taskApi.delete(task.id); setAllTasks((p) => p.filter((x) => x.id !== task.id)); }} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[task.status]}`}>{task.status === "PENDING" ? "In Progress" : "Done"}</span>
                                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                                        {task.priority.toLowerCase()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${task.status === "COMPLETED" ? 100 : task.progress}%` }} />
                                      </div>
                                      <span className="text-xs text-gray-400">{task.status === "COMPLETED" ? 100 : task.progress}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreated={(p) => {
            setProjects((prev) => [p, ...prev]);
            setExpandedProjects((prev) => new Set([...prev, p.id]));
          }}
        />
      )}
      {showCreateTask && selectedProjectId && (
        <CreateTaskModal
          projects={projects}
          defaultProjectId={selectedProjectId}
          onClose={() => { setShowCreateTask(false); setSelectedProjectId(null); }}
          onCreated={(t) => {
            setAllTasks((prev) => [t, ...prev]);
            setShowCreateTask(false);
            setSelectedProjectId(null);
          }}
        />
      )}
    </div>
  );
}
