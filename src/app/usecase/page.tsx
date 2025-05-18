"use client";

import { useState } from "react";
import MermaidChart from "~/components/mermaid-diagram";
import LoadingAnimation from "~/components/loading-animation";
import UsecaseCard from "~/components/usecase-card";
import UsecaseHero from "~/components/usecase-hero";

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
      const data = (await res.json()) as { mermaid?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to generate diagram");
      } else {
        setDiagram(data.mermaid ?? "");
      }
    } catch {
      setError("Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <UsecaseHero />
      <div className="flex w-full justify-center pt-8">
        <UsecaseCard
          description={description}
          model={model}
          loading={loading}
          onDescriptionChange={setDescription}
          onModelChange={setModel}
          onSubmit={handleSubmit}
        />
      </div>
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
