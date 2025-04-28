"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  colors?: string[];
};

const DEFAULT_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
}: ColorPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {/* Default/Clear Button */}
      <button
        type="button"
        className={cn(
          "h-6 w-full rounded-sm border border-input bg-transparent text-xs text-muted-foreground transition-all duration-100 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          (value === "" || value === undefined) &&
            "ring-2 ring-ring ring-offset-2",
          "hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={() => onChange?.("")}
        aria-label="Select default (no color)"
      >
        Default
      </button>

      {/* Color Buttons */}
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-6 w-full rounded-sm border border-transparent transition-all duration-100 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            value === color && "ring-2 ring-ring ring-offset-2",
            "hover:opacity-80"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange?.(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
