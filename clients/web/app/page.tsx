"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("用户注册时必须绑定手机号，密码至少8位");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    try {
      const res = await fetch(`${base}/requirement/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">需求结构化抽取</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />

      <button
        onClick={handleSubmit}
        type="button"
        disabled={loading}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "提取中..." : "提交"}
      </button>

      {result !== null && (
        <pre className="mt-6 overflow-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
