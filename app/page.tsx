import { db } from "@/db/client";
import { todos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { addTodo } from "./actions";
import { TodoItem } from "./todo-item";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await db.select().from(todos).orderBy(desc(todos.createdAt));

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-lg">
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">
          Todo List
        </h1>

        <form action={addTodo} className="mb-6 flex gap-2">
          <input
            name="title"
            placeholder="What needs doing?"
            required
            className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No todos yet — add one above.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
