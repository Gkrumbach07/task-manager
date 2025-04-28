export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="text-sm">
      {"success" in message && (
        <div className="text-foreground py-4">{message.success}</div>
      )}
      {"error" in message && (
        <div className=" text-destructive py-4">{message.error}</div>
      )}
      {"message" in message && (
        <div className="text-foreground py-4">{message.message}</div>
      )}
    </div>
  );
}
