import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
            T
          </div>
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how" className="text-sm text-gray-400 hover:text-white transition-colors">
            How it works
          </a>
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
          ⚡ Real-time Collaboration
        </div>
        <h1 className="text-6xl sm:text-7xl font-extrabold leading-tight mb-6">
          Manage projects,
          <br />
          <span className="text-green-400">track tasks,</span> ship faster.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          A collaborative task manager with project hierarchies, real-time socket updates, priority tracking, and powerful analytics — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            style={{ boxShadow: "0 10px 30px rgba(34,197,94,0.2)" }}
          >
            Start for free →
          </Link>
          <a
            href="#features"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            Explore features
          </a>
        </div>

        {/* Mock task board preview */}
        <div className="mt-20 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl text-left mx-auto max-w-4xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <span className="font-semibold text-white text-sm">📋 Task Board</span>
            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg font-medium cursor-pointer">
              + Add New
            </span>
          </div>
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-2.5 border-b border-gray-800 bg-gray-800/40">
            {["Task", "Status", "Priority", "Progress"].map((h) => (
              <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-800">
            {[
              { title: "Design Wireframes", status: "In Progress", statusColor: "bg-blue-500/20 text-blue-400", priority: "HIGH", priorityColor: "bg-red-500", progress: 25 },
              { title: "Build API Endpoints", status: "Completed", statusColor: "bg-green-500/20 text-green-400", priority: "NORMAL", priorityColor: "bg-yellow-400", progress: 100 },
              { title: "Write Unit Tests", status: "In Progress", statusColor: "bg-blue-500/20 text-blue-400", priority: "LOW", priorityColor: "bg-green-400", progress: 60 },
              { title: "Deploy to Production", status: "Completed", statusColor: "bg-green-500/20 text-green-400", priority: "HIGH", priorityColor: "bg-red-500", progress: 100 },
            ].map((row) => (
              <div key={row.title} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3.5 items-center hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${row.progress === 100 ? "bg-green-500 border-green-500" : "border-gray-600"}`} />
                  <span className="text-sm text-gray-200">{row.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${row.statusColor}`}>
                  {row.status}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${row.priorityColor}`} />
                  <span className="text-xs text-gray-400">{row.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${row.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{row.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "Real-time", label: "Socket updates" },
            { value: "JWT", label: "Secure auth" },
            { value: "∞", label: "Projects" },
            { value: "Charts", label: "Analytics" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-green-400 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything your team needs</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Built for teams that move fast and need their tools to keep up.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🗂️", title: "Project Hierarchy", desc: "Organize work into Projects, then break them down into individual Tasks with priorities, assignees, and due dates." },
            { icon: "⚡", title: "Real-time Updates", desc: "Every create, update, delete and assignment broadcasts instantly via WebSockets to all connected teammates." },
            { icon: "📊", title: "Analytics Dashboard", desc: "Completion rate, status breakdowns, priority distributions, 30-day trend charts and per-project stats." },
            { icon: "🔒", title: "Google OAuth", desc: "One-click sign-in with Google. Backend protected with JWT authentication on every API route." },
            { icon: "👥", title: "Task Assignment", desc: "Assign tasks to teammates by email. Pending invites are tracked until the user joins." },
            { icon: "📈", title: "Progress Tracking", desc: "Track per-task progress percentage alongside PENDING/COMPLETED status so nothing slips through." },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-7 hover:border-green-500/30 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-900 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Get started in 3 steps</h2>
          <div className="grid sm:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Sign in with Google", desc: "No passwords. One click and you're in — Google OAuth handled securely." },
              { step: "02", title: "Create a project", desc: "Group related tasks under a project with a color, description, and teammates." },
              { step: "03", title: "Add & assign tasks", desc: "Create tasks, set priorities, due dates, and watch updates sync in real-time." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-6xl font-black text-green-500/20 mb-3">{s.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="text-5xl font-extrabold mb-5">Ready to get organized?</h2>
        <p className="text-gray-400 mb-10 text-xl">
          Sign in with Google and start collaborating in seconds.
        </p>
        <Link
          href="/login"
          className="bg-green-500 hover:bg-green-400 text-white font-bold px-12 py-5 rounded-xl text-xl inline-block transition-colors"
          style={{ boxShadow: "0 10px 30px rgba(34,197,94,0.2)" }}
        >
          Sign in with Google →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
        © 2026 TaskFlow · Real-time Collaborative Task Manager
      </footer>
    </div>
  );
}
