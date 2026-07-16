import React from "react";

/**
 * TypingIndicator — three bouncing dots inside a bubble, used while the AI
 * assistant (or, in future, a human participant) is composing a reply.
 *
 * Props:
 *  - label    – text shown above the dots (e.g. "AI Assistant")
 *  - isDark   – dark-mode flag, matches the app-wide theme convention
 */
const TypingIndicator = ({ label = "AI Assistant", isDark = false }) => {
  return (
    <div className="flex justify-start">
      <div
        className={`flex flex-col rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border ${
          isDark ? "bg-[#1a1f2e] border-[#1e2336]" : "bg-white border-gray-200"
        }`}
      >
        {label && (
          <span className={`text-[12px] font-medium mb-1.5 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
            {label}
          </span>
        )}
        <div className="flex items-center gap-1.5 h-4 px-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`}
            style={{ animationDelay: "0ms" }}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`}
            style={{ animationDelay: "150ms" }}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? "bg-gray-500" : "bg-gray-400"}`}
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
