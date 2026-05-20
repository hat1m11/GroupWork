import type { MessageWithUser } from "@/lib/supabase/types";

interface Props {
  message: MessageWithUser;
  isOwn: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ChatMessage({ message, isOwn }: Props) {
  const sender = message.users?.full_name ?? message.users?.email?.split("@")[0] ?? "Unknown";

  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      {!isOwn && (
        <span className="text-xs text-gray-400 px-1">{sender}</span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words ${
          isOwn
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-[#1E2A3A] text-gray-100 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      <span className="text-xs text-gray-600 px-1">{formatTime(message.created_at)}</span>
    </div>
  );
}
