"use client";

import React from "react";
import mermaid from "mermaid";
import { Button } from "~/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts

interface UsecaseExportControlsProps {
  mermaidCode: string;
  diagramTitle?: string; // Optional title for downloaded files
}

export default function UsecaseExportControls({
  mermaidCode,
  diagramTitle = "diagram",
}: UsecaseExportControlsProps) {
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      toast.success("Mermaid code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy code. Please try again.");
      console.error("Failed to copy Mermaid code: ", err);
    }
  };

  const triggerDownload = (filename: string, dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename.toUpperCase()} downloaded successfully!`);
  };

  const handleDownloadSVG = async () => {
    if (!mermaidCode) {
      toast.error("No diagram content to download.");
      return;
    }
    try {
      // Ensure Mermaid is initialized (config from MermaidChart.tsx can be reused if needed)
      mermaid.initialize({ startOnLoad: false, theme: "neutral", htmlLabels: true });
      const { svg } = await mermaid.render(
        `mermaid-svg-${Date.now()}`,
        mermaidCode,
      );
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(
        unescape(encodeURIComponent(svg)),
      )}`;
      triggerDownload(`${diagramTitle}.svg`, svgDataUrl);
    } catch (error) {
      console.error("Failed to generate SVG:", error);
      toast.error("Failed to generate SVG. Please try again.");
    }
  };

  const handleDownloadPNG = async () => {
    if (!mermaidCode) {
      toast.error("No diagram content to download.");
      return;
    }
    try {
      mermaid.initialize({ startOnLoad: false, theme: "neutral", htmlLabels: true });
      const { svg } = await mermaid.render(
        `mermaid-png-${Date.now()}`,
        mermaidCode,
      );

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Canvas context not available for PNG generation.");
        return;
      }

      const img = new Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Optional: Add some padding or increase scale for better PNG quality
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.setTransform(scale, 0, 0, scale, 0, 0); // Apply scaling
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL("image/png");
        triggerDownload(`${diagramTitle}.png`, pngDataUrl);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error("Failed to load SVG into image for PNG conversion.");
      };
      img.src = url;
    } catch (error) {
      console.error("Failed to generate PNG:", error);
      toast.error("Failed to generate PNG. Please try again.");
    }
  };

  if (!mermaidCode) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-md border-[3px] border-black bg-purple-100 p-4 shadow-[4px_4px_0_0_#000000] sm:flex-row sm:justify-center sm:gap-4">
      <Button
        onClick={handleCopyToClipboard}
        variant="outline"
        className="w-full border-2 border-black bg-purple-300 text-black hover:bg-purple-400 sm:w-auto"
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy Mermaid Code
      </Button>
      <Button
        onClick={handleDownloadSVG}
        variant="outline"
        className="w-full border-2 border-black bg-purple-300 text-black hover:bg-purple-400 sm:w-auto"
      >
        <Download className="mr-2 h-4 w-4" />
        Download SVG
      </Button>
      <Button
        onClick={handleDownloadPNG}
        variant="outline"
        className="w-full border-2 border-black bg-purple-300 text-black hover:bg-purple-400 sm:w-auto"
      >
        <Download className="mr-2 h-4 w-4" />
        Download PNG
      </Button>
    </div>
  );
}
