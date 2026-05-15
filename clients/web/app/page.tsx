"use client";

import { APP_NAME } from "@repo/contracts";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState("");

  async function callApi() {
    const res = await fetch("/api/hello");
    const data = (await res.json()) as { message: string };
    setResult(data.message);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>{APP_NAME}</h1>
      <button type="button" onClick={callApi}>
        调用 API
      </button>
      <pre style={{ marginTop: 16 }}>{result}</pre>
    </main>
  );
}
