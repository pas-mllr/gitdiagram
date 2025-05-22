"use client";

import { useState } from "react";
import MermaidChart from "~/components/mermaid-diagram";
import UsecaseCard from "~/components/usecase-card";
import UsecaseHero from "~/components/usecase-hero";
import UsecaseExportControls from "~/components/usecase-export-controls";
import { Button } from "~/components/ui/button"; // Import Button
import { RefreshCcw } from "lucide-react"; // Import an icon for regenerate

export default function UseCasePage() {
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("o1");
  const [diagram, setDiagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Wrapped handleSubmit in a new function to be callable without event
  const handleGenerateDiagram = async () => {
    setLoading(true);
    setApiError("");
    setDiagram(""); // Clear previous diagram on new generation or regeneration
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

      if (!res.ok) {
        const errorText = await res.text();
        setApiError(
          `Failed to generate diagram. Status: ${res.status}. ${errorText}`,
        );
        setLoading(false);
        return;
      }

      const data = (await res.json()) as { mermaid?: string; error?: string };
      if (data.error) {
        setApiError(data.error);
      } else {
        setDiagram(data.mermaid ?? "");
      }
    } catch (e) {
      if (e instanceof Error) {
        setApiError(`Failed to generate diagram: ${e.message}`);
      } else {
        setApiError("An unknown error occurred while generating the diagram.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleGenerateDiagram(); // Call the actual generation logic
  };

  // Regenerate handler
  const handleRegenerate = () => {
    // No need to check for description emptiness here as UsecaseCard handles it
    // and the button would typically only be active if a diagram was previously generated.
    void handleGenerateDiagram(); // Call the actual generation logic
  };

  return (
    <div className="flex flex-col items-center p-4">
      <UsecaseHero />
      <div className="flex w-full justify-center pt-8">
        <UsecaseCard
          description={description}
          model={model}
          loading={loading}
          apiError={apiError}
          onDescriptionChange={setDescription}
          onModelChange={setModel}
          onSubmit={handleSubmit}
        />
      </div>

      {diagram && !loading && !apiError && (
        <div className="mt-8 w-full max-w-4xl">
          <MermaidChart chart={diagram} />
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <UsecaseExportControls
              mermaidCode={diagram}
              diagramTitle="usecase-diagram"
            />
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="w-full border-2 border-black bg-green-300 text-black hover:bg-green-400 sm:w-auto"
              disabled={loading} // Disable if already loading
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
