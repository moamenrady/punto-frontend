import React, { useContext, useEffect, useRef, useState } from "react";
import { Bot, Send, Loader2, AlertCircle, CheckCircle2, Sparkles, ListChecks } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { AiFeatures } from "../services/aiOpsService";

// How many prior turns to send back as context on each chat request.
const HISTORY_WINDOW = 12;

let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

/**
 * AIAssistantPanel
 *
 * Core AI surface for the ticketing system: a conversational assistant
 * (/chat) alongside an AI-driven "assign task to team" action
 * (/api/ai/assign-task). Designed to be dropped into an Admin Panel or
 * its own route.
 *
 * Props:
 *  - user: optional override for the logged-in user (falls back to AuthContext)
 */
const AIAssistantPanel = ({ user: userProp }) => {
  const auth = useContext(AuthContext);
  const user = userProp || auth?.user;

  const [activeTab, setActiveTab] = useState("chat");

  // ── Chat state ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      role: "assistant",
      content: "Hi! I'm your IT assistant. Ask me about tickets, tasks, or stock — I'll look into it.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Assign task state ─────────────────────────────────────────────────
  const [taskId, setTaskId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignResult, setAssignResult] = useState(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const canChat = Boolean(user?._id && user?.company_id);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isThinking) return;

    if (!canChat) {
      setChatError("You must be logged in with a company to use the assistant.");
      return;
    }

    const userMessage = { id: nextId(), role: "user", content: query };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setChatError(null);
    setIsThinking(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const chatHistory = updated
        .slice(-HISTORY_WINDOW)
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await AiFeatures.sendChatMessage({
        query,
        userRole: user.role || "user",
        userId: user._id,
        companyId: user.company_id,
        chatHistory,
      });

      const replyText =
        data?.response ?? data?.answer ?? data?.message ?? "I didn't get a clear response — please try rephrasing.";

      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: replyText }]);
    } catch (err) {
      setChatError(err.message);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: "Sorry, I ran into a problem answering that.", isError: true },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!taskId.trim() || !teamId.trim() || isAssigning) return;

    setIsAssigning(true);
    setAssignError(null);
    setAssignResult(null);

    try {
      const data = await AiFeatures.assignTask({ taskId: taskId.trim(), teamId: teamId.trim() });
      setAssignResult(data?.message || "Task assigned successfully.");
      setTaskId("");
      setTeamId("");
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[720px] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-[15px] leading-tight">AI Operations Assistant</h2>
            <p className="text-[12px] text-white/70">Powered by the IT Management Agentic RAG API</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "chat"
              ? "border-indigo-600 text-indigo-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bot size={16} /> Chat
        </button>
        <button
          onClick={() => setActiveTab("assign")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "assign"
              ? "border-indigo-600 text-indigo-600 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ListChecks size={16} /> Assign Task
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : m.isError
                      ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {chatError && (
            <div className="flex items-center gap-2 px-5 py-2 text-[13px] text-red-600 bg-red-50 border-t border-red-100 shrink-0">
              <AlertCircle size={14} className="shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-200 bg-white shrink-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={isThinking}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={canChat ? "Ask about a ticket, task, or stock level..." : "Log in to chat with the assistant"}
              className="flex-1 resize-none max-h-[120px] rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking || !canChat}
              className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
        </div>
      )}

      {/* Assign task tab */}
      {activeTab === "assign" && (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-sm text-gray-500 mb-5">
            Let the AI pick the best next step for assigning an existing task to a team, then confirm it below.
          </p>

          <form onSubmit={handleAssign} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Task ID</label>
              <input
                type="text"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="e.g. 665f1c2a9b1e4a0012345678"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team ID</label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="e.g. 665f1c2a9b1e4a0012345999"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {assignError && (
              <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            {assignResult && (
              <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{assignResult}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!taskId.trim() || !teamId.trim() || isAssigning}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Assigning...
                </>
              ) : (
                "Assign Task"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
