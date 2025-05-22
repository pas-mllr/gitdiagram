"use client";

import { Card } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import React, { useState } from "react";
import { Loader2 } from "lucide-react"; // For loading indicator

interface UsecaseCardProps {
  description: string;
  model: string;
  loading?: boolean;
  apiError?: string; // To receive API errors from parent
  onDescriptionChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const MAX_DESCRIPTION_LENGTH = 5000;

export default function UsecaseCard({
  description,
  model,
  loading,
  apiError,
  onDescriptionChange,
  onModelChange,
  onSubmit,
}: UsecaseCardProps) {
  const [descriptionError, setDescriptionError] = useState<string>("");

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newDescription = event.target.value;
    if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    } else {
      setDescriptionError("");
    }
    onDescriptionChange(newDescription);
  };

  const currentError = apiError || descriptionError;

  return (
    <Card className="relative w-full max-w-3xl border-[3px] border-black bg-purple-200 p-4 shadow-[8px_8px_0_0_#000000] sm:p-8">
      <form
        onSubmit={(e) => {
          if (descriptionError) {
            e.preventDefault(); // Prevent submission if there's a description error
            return;
          }
          onSubmit(e);
        }}
        className="space-y-4 sm:space-y-6"
      >
        <div>
          <Textarea
            placeholder="Describe your use case (max 5000 characters)"
            className={`min-h-[120px] rounded-md border-[3px] border-black px-3 py-4 text-base font-bold shadow-[4px_4px_0_0_#000000] placeholder:text-base placeholder:font-normal placeholder:text-gray-700 sm:px-4 sm:py-6 sm:text-lg sm:placeholder:text-lg ${
              loading ? "bg-gray-100" : ""
            } ${descriptionError ? "border-red-500" : ""}`}
            value={description}
            onChange={handleDescriptionChange}
            disabled={loading}
            maxLength={MAX_DESCRIPTION_LENGTH + 100} // Allow some leeway for typing before error
          />
          {descriptionError && !apiError && ( // Show description error only if no API error
            <p className="mt-2 text-sm text-red-600">{descriptionError}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <select
            className={`rounded-md border-[3px] border-black px-3 py-4 text-base font-bold shadow-[4px_4px_0_0_#000000] sm:px-4 sm:py-6 sm:text-lg ${
              loading ? "bg-gray-100" : ""
            }`}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={loading}
          >
            <option value="o1">o1</option>
            <option value="o3">o3</option>
            <option value="o4">o4</option>
          </select>
          <Button
            type="submit"
            className="flex items-center justify-center border-[3px] border-black bg-purple-400 p-4 px-4 text-base text-black shadow-[4px_4px_0_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:transform hover:bg-purple-400 sm:p-6 sm:px-6 sm:text-lg"
            disabled={loading || !!descriptionError}
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Diagram
          </Button>
        </div>
        {currentError && (
          <p className="mt-2 text-center text-red-600">{currentError}</p>
        )}
      </form>
    </Card>
  );
}

