"use client";

import { useActionState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

type RegisterAction = (prevState: FormState, formData: FormData) => Promise<FormState>;

export function RegisterForm({
  action,
  universities,
}: {
  action: RegisterAction;
  universities: { id: string; name: string; domain: string }[];
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as FormState);

  return (
    <>
      {state.status === "error" && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {state.message}
        </p>
      )}
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            University
          </label>
          <select
            name="universityId"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Select your university</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name} ({uni.domain})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            University email
          </label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            placeholder="you@aau.edu.et"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Confirm password
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
        >
          Register
        </button>
      </form>
    </>
  );
}
