import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { QueryStatus } from "./types";

export const getStatusColor = (status: QueryStatus["status"]) => {
  switch (status) {
    case "loaded":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "idle":
    case "loading":
    default:
      return "text-gray-400";
  }
};
export const getStatusIcon = (status: QueryStatus["status"]) => {
  switch (status) {
    case "loading":
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case "loaded":
      return <CheckCircle2 className="h-4 w-4" />;
    case "error":
      return <XCircle className="h-4 w-4" />;
    case "idle":
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};
