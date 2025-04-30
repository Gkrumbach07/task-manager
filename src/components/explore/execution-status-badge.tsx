import { cn } from "@/lib/utils";

export const ExecutionStatusBadge = ({
  success,
  error,
  selected,
}: {
  success: number;
  error: number;
  selected: number;
}) => {
  return (
    <span
      className={cn(
        "text-sm font-normal px-2 py-0.5 rounded",
        error > 0 && "bg-red-100 text-red-700",
        error === 0 && selected > 0 && "bg-blue-100 text-blue-700",
        error === 0 && selected === 0 && "bg-gray-100 text-gray-600"
      )}
    >
      {selected} enabled
      {selected > 0 && ` (${success} loaded`}
      {error > 0 && `, ${error} failed`}
      {selected > 0 && `)`}
    </span>
  );
};
