"use client";

import { useState } from "react";
import MermaidChart from "~/components/mermaid-diagram";
import LoadingAnimation from "~/components/loading-animation";

export default function UseCasePage() {
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("o1");
  const [diagram, setDiagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_DEV_URL ?? "https://api.gitdiagram.com";
      const res = await fetch(`${baseUrl}/usecase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          model,
          api_key: localStorage.getItem("openai_key") ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to generate diagram");
      } else {
        setDiagram(data.mermaid);
      }
    } catch (err) {
      setError("Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="mt-8 text-center text-2xl font-semibold">
        Use case to diagram.
      </h1>
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex w-full max-w-xl flex-col gap-4"
      >
        <textarea
          className="min-h-[120px] w-full rounded border p-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="w-32 rounded border p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="o1">o1</option>
          <option value="o3">o3</option>
          <option value="o4">o4</option>
        </select>
        <button
          type="submit"
          className="rounded bg-purple-600 px-4 py-2 font-medium text-white"
          disabled={loading}
        >
          Generate
        </button>
      </form>
      {loading && (
        <div className="mt-8">
          <LoadingAnimation />
        </div>
      )}
      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      {diagram && !loading && (
        <div className="mt-8 w-full">
          <MermaidChart chart={diagram} />
        </div>
      )}
    </div>
  );
}
