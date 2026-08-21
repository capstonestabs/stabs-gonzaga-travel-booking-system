import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessageCircleQuestion, Bell } from "lucide-react";
import type { StaffTaskReminder } from "@/lib/types";

const ICONS = {
  calendar: { Icon: CalendarDays, bg: "bg-amber-50", color: "text-amber-600" },
  inquiry: { Icon: MessageCircleQuestion, bg: "bg-blue-50", color: "text-blue-600" },
  bell: { Icon: Bell, bg: "bg-emerald-50", color: "text-emerald-600" }
} as const;

export function TasksRemindersPanel({ tasks }: { tasks: StaffTaskReminder[] }) {
  if (!tasks.length) return null;

  return (
    <section aria-label="Tasks and reminders" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Tasks &amp; Reminders</h2>
      <div className="mt-3 divide-y divide-slate-100">
        {tasks.map((task) => {
          const { Icon, bg, color } = ICONS[task.icon];
          return (
            <Link
              key={task.id}
              href={task.href as Route}
              className="-mx-5 flex items-center gap-4 rounded-lg px-5 py-4 first:pt-4 last:pb-0 hover:bg-slate-50"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">{task.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}