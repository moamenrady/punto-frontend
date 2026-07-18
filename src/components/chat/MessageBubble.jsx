import React from "react";
import { AlertCircle, Bot } from "lucide-react";

const formatTime = (dateString) => {
  const d = dateString ? new Date(dateString) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * MessageBubble — renders a single chat message.
 *
 * Props:
 *  - message         – { _id, senderId, senderName, text, createdAt, isError?, pending? }
 *  - isMe            – true when the current user sent this message
 *  - showSenderName  – show the sender's name above the bubble (group chats)
 *  - isAiSender      – true when this message came from the AI assistant
 *  - isDark          – dark-mode flag
 */
const MessageBubble = ({ message, isMe, showSenderName = false, isAiSender = false, isDark = false }) => {
  const isError = Boolean(message?.isError);
  const isPending = Boolean(message?.pending);

  const bubbleClasses = isMe
    ? "bg-indigo-600 text-white rounded-br-sm"
    : isError
    ? isDark
      ? "bg-red-950/40 text-red-300 border border-red-900 rounded-bl-sm"
      : "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
    : isDark
    ? "bg-[#1a1f2e] text-gray-100 border border-[#1e2336] rounded-bl-sm"
    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex flex-col max-w-[78%] sm:max-w-[65%]">
        {showSenderName && !isMe && (
          <span
            className={`text-[12px] font-semibold mb-1 ml-1 flex items-center gap-1 ${
              isDark ? "text-indigo-300" : "text-indigo-600"
            }`}
          >
            {isAiSender && <Bot size={12} />}
            {message.senderName || "Unknown"}
          </span>
        )}

        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${bubbleClasses}`}>
          {isError && (
            <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold">
              <AlertCircle size={13} /> Error
            </div>
          )}
          {message.text}
        </div>

        <span
          className={`text-[11px] mt-1 ${isMe ? "text-right mr-1" : "ml-1"} ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {isPending ? "Sending…" : formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
