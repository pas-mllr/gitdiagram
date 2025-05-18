"use client";

import { Card } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import React from "react";

interface UsecaseCardProps {
  description: string;
  model: string;
  loading?: boolean;
  onDescriptionChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function UsecaseCard({
  description,
  model,
  loading,
  onDescriptionChange,
  onModelChange,
  onSubmit,
}: UsecaseCardProps) {
  return (
    <Card className="relative w-full max-w-3xl border-[3px] border-black bg-purple-200 p-4 shadow-[8px_8px_0_0_#000000] sm:p-8">
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        <Textarea
          placeholder="Describe your use case"
          className="min-h-[120px] rounded-md border-[3px] border-black px-3 py-4 text-base font-bold shadow-[4px_4px_0_0_#000000] placeholder:text-base placeholder:font-normal placeholder:text-gray-700 sm:px-4 sm:py-6 sm:text-lg sm:placeholder:text-lg"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <select
            className="rounded-md border-[3px] border-black px-3 py-4 text-base font-bold shadow-[4px_4px_0_0_#000000] sm:px-4 sm:py-6 sm:text-lg"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="o1">o1</option>
            <option value="o3">o3</option>
            <option value="o4">o4</option>
          </select>
          <Button
            type="submit"
            className="border-[3px] border-black bg-purple-400 p-4 px-4 text-base text-black shadow-[4px_4px_0_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:transform hover:bg-purple-400 sm:p-6 sm:px-6 sm:text-lg"
            disabled={loading}
          >
            Diagram
          </Button>
        </div>
      </form>
    </Card>
  );
}

