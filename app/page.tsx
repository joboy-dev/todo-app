import { db } from "@/db/client";
import { todos } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { AddTodoForm } from "./add-todo-form";
import { TodoApp } from "./todo-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await db.select().from(todos).orderBy(asc(todos.sortOrder));

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 px-4 py-12 font-sans dark:from-black dark:to-zinc-950">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ClipboardList size={18} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Todo List
          </h1>
        </div>

        <AddTodoForm />
        <TodoApp todos={items} />
      </main>
    </div>
  );
}
