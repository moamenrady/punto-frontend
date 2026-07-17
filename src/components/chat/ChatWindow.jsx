import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  X,
  Info,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import Avatar from "../Avatar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { AiFeatures } from "../../services/aiOpsService";
import chatService from "../../services/chatService";

const HISTORY_WINDOW = 12;
let idCounter = 0;
const nextId = () => `msg-${Date.now()}-${idCounter++}`;

const AI_GREETING = {
  id: nextId(),
  senderId: "ai_assistant",
  senderName: "AI Assistant",
  text: "Hi! I'm your AI assistant. Ask me about tickets, tasks, or stock levels, or tell me what you need done and I'll take care of it.",
  createdAt: new Date().toISOString(),
};

// Backend Message documents use { chat, sender, content } — sender is
// populated as { _id, name, email, photo } when the API includes it. These
// normalize a raw Message into the { senderId, senderName, text } shape the
// rest of this component (and MessageBubble) already expects.
const getSenderId = (sender) => (sender && typeof sender === "object" ? sender._id : sender);
const getSenderName = (sender, fallback) => (sender && typeof sender === "object" && sender.name ? sender.name : fallback);

const normalizeMessage = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,
    senderId: getSenderId(raw.sender) ?? raw.senderId,
    senderName: getSenderName(raw.sender, raw.senderName),
    text: raw.content ?? raw.text,
  };
};

const belongsToChat = (raw, chatId) => {
  const msgChatId = raw?.chat?._id ?? raw?.chat ?? raw?.chatId;
  return Boolean(msgChatId) && String(msgChatId) === String(chatId);
};

/**
 * ChatWindow — the right-hand pane of the Chat & Messaging page.
 * Renders one of three chat kinds:
 *   - chatType 'ai'   : conversational assistant (POST /chat via aiOpsService)
 *   - chatType 'team' : group chat over the realtime socket
 *   - chatType 'dm'   : 1-on-1 chat over the realtime socket
 *
 * Props:
 *  - chatType  – 'ai' | 'team' | 'dm' | null
 *  - team      – team object (chatType === 'team')
 *  - contact   – user object (chatType === 'dm')
 *  - user      – logged-in user
 *  - isDark    – dark-mode flag
 *  - onBack    – fn() – mobile "back to list" handler
 *  - onStartDM – fn(member) – called when a group member (not self) is clicked
 */
const ChatWindow = ({ chatType, team, contact, user, isDark = false, onBack, onStartDM }) => {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const joinedChatIdRef = useRef(null);

  // Real Chat document id backing the currently-open team/DM conversation.
  // team._id is a Team, not a Chat — and DMs have no id at all until one is
  // opened — so this is resolved (found-or-created) asynchronously below.
  // Nothing loads or sends until it's set.
  const [resolvedChatId, setResolvedChatId] = useState(null);
  const [isResolvingChat, setIsResolvingChat] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [resolveAttempt, setResolveAttempt] = useState(0);

  const aiHistoryKey = user?._id ? `ai_chat_history_${user._id}` : "ai_chat_history";

  // ── Load message history for the resolved chat ─────────────────────────
  const loadTeamOrDmMessages = useCallback(() => {
    if (!resolvedChatId) return;
    setIsLoadingMessages(true);
    setMessagesError(null);
    chatService
      .fetchChatMessages(resolvedChatId)
      .then((data) => setMessages(Array.isArray(data) ? data.map(normalizeMessage) : []))
      .catch((err) => setMessagesError(err.message))
      .finally(() => setIsLoadingMessages(false));
  }, [resolvedChatId]);

  // ── Resolve chatType/team/contact into a real Chat document id ──────────
  useEffect(() => {
    setShowInfo(false);
    setChatError(null);
    setMessagesError(null);
    setResolveError(null);

    if (chatType === "ai") {
      try {
        const saved = localStorage.getItem(aiHistoryKey);
        const parsed = saved ? JSON.parse(saved) : null;
        setMessages(Array.isArray(parsed) && parsed.length ? parsed : [AI_GREETING]);
      } catch {
        setMessages([AI_GREETING]);
      }
      return;
    }

    const identity = chatType === "team" ? team?._id : chatType === "dm" ? contact?._id : null;
    if (!chatType || !identity) {
      setMessages([]);
      setResolvedChatId(null);
      return;
    }

    let cancelled = false;
    setMessages([]);
    setResolvedChatId(null);
    setIsResolvingChat(true);

    const resolve =
      chatType === "team"
        ? chatService.resolveTeamChatId(team, user?._id)
        : chatService.resolveDmChatId(contact, user?._id);

    resolve
      .then((chatId) => {
        if (cancelled || !chatId) return;

        // Leave whichever room we were previously in before joining the new
        // one. This matters most for users who belong to several teams:
        // without it, the socket would stay subscribed to every team room
        // ever opened this session, and a message for a background team
        // could otherwise get mis-attributed to whichever chat happens to be
        // open right now.
        if (joinedChatIdRef.current && joinedChatIdRef.current !== chatId) {
          chatService.leaveChat(joinedChatIdRef.current);
        }
        chatService.joinChat(chatId);
        joinedChatIdRef.current = chatId;
        setResolvedChatId(chatId);
      })
      .catch((err) => {
        if (!cancelled) setResolveError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsResolvingChat(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatType, chatType === "team" ? team?._id : contact?._id, resolveAttempt]);

  // ── Load history + subscribe to realtime updates for the resolved chat ──
  useEffect(() => {
    if (chatType === "ai" || !resolvedChatId) return;

    loadTeamOrDmMessages();

    const unsubscribe = chatService.onReceiveMessage((raw) => {
      if (!belongsToChat(raw, resolvedChatId)) return;
      const msg = normalizeMessage(raw);
      setMessages((prev) => (prev.find((m) => m._id === msg._id) ? prev : [...prev, msg]));
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedChatId, chatType]);

  // Leave the last-joined room on unmount (e.g. navigating away from the page).
  useEffect(() => {
    return () => {
      if (joinedChatIdRef.current) chatService.leaveChat(joinedChatIdRef.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const canChatWithAi = Boolean(user?._id && user?.company_id);

  const persistAiMessages = (updated) => {
    try {
      localStorage.setItem(aiHistoryKey, JSON.stringify(updated));
    } catch {
      /* localStorage full/unavailable — non-fatal, chat still works in-memory */
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (chatType === "ai") {
      if (isThinking) return;
      if (!canChatWithAi) {
        setChatError("You must be logged in with a company to use the assistant.");
        return;
      }

      const userMessage = { _id: nextId(), senderId: user._id, senderName: user.name, text, createdAt: new Date().toISOString() };
      const updated = [...messages, userMessage];
      setMessages(updated);
      persistAiMessages(updated);
      setInput("");
      setChatError(null);
      setIsThinking(true);

      try {
        const chatHistory = updated.slice(-HISTORY_WINDOW).map((m) => ({
          role: m.senderId === "ai_assistant" ? "assistant" : "user",
          content: m.text,
        }));

        const data = await AiFeatures.sendChatMessage({
          query: text,
          userRole: user.role || "user",
          userId: user._id,
          companyId: user.company_id,
          chatHistory,
        });

        const replyText = data?.response ?? data?.answer ?? data?.message ?? "I didn't get a clear response — please try rephrasing.";
        const aiMessage = { _id: nextId(), senderId: "ai_assistant", senderName: "AI Assistant", text: replyText, createdAt: new Date().toISOString() };
        setMessages((prev) => {
          const next = [...prev, aiMessage];
          persistAiMessages(next);
          return next;
        });
      } catch (err) {
        setChatError(err.message);
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              _id: nextId(),
              senderId: "ai_assistant",
              senderName: "AI Assistant",
              text: `Sorry, I ran into a problem answering that (${err.message}).`,
              createdAt: new Date().toISOString(),
              isError: true,
            },
          ];
          persistAiMessages(next);
          return next;
        });
      } finally {
        setIsThinking(false);
      }
      return;
    }

    if (!resolvedChatId) return;

    // Show the message immediately, then swap it for the server-confirmed
    // copy once the REST call resolves. Sending no longer depends on the
    // socket echoing the message back, so it can't get stuck at "Sending…".
    const tempId = `local-${nextId()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: user._id,
      senderName: user.name,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    try {
      const saved = await chatService.sendMessage({ chat: resolvedChatId, content: text });
      const confirmed = normalizeMessage(saved);
      setMessages((prev) => prev.map((m) => (m._id === tempId ? confirmed : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, pending: false, isError: true } : m)));
      setMessagesError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Empty state: nothing selected ───────────────────────────────────────
  if (!chatType) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${isDark ? "bg-[#0b0d14]" : "bg-gray-50"}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-[#1a1f2e]" : "bg-white border border-gray-200"}`}>
          <MessageCircle size={24} className={isDark ? "text-gray-500" : "text-gray-300"} />
        </div>
        <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Select a conversation to start chatting
        </p>
      </div>
    );
  }

  const title = chatType === "ai" ? "AI Assistant" : chatType === "team" ? team?.name || "Group Chat" : contact?.name || "Direct Message";
  const subtitle =
    chatType === "ai"
      ? "Always available • Powered by the Agentic RAG API"
      : chatType === "team"
      ? `${team?.members?.length ?? 0} members`
      : contact?.email || contact?.role || "Direct message";

  const headerBg = isDark ? "bg-[#0f1117]" : "bg-white";
  const headerBorder = isDark ? "border-[#1e2336]" : "border-gray-200";
  const headerText = isDark ? "text-gray-100" : "text-gray-900";
  const headerSub = isDark ? "text-gray-500" : "text-gray-500";
  const bodyBg = isDark ? "bg-[#0b0d14]" : "bg-gray-50";
  const iconBtn = isDark ? "text-gray-400 hover:bg-[#1a1f2e]" : "text-gray-500 hover:bg-gray-100";

  return (
    <div className="flex-1 flex overflow-hidden min-w-0">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-5 py-3.5 border-b shrink-0 ${headerBg} ${headerBorder}`}>
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button onClick={onBack} className={`md:hidden p-1.5 -ml-1.5 rounded-lg transition-colors ${iconBtn}`}>
                <ArrowLeft size={19} />
              </button>
            )}
            {chatType === "ai" ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                <Sparkles size={18} />
              </div>
            ) : chatType === "team" ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isDark ? "bg-[#1e2336] text-indigo-300" : "bg-indigo-100 text-indigo-600"}`}>
                {title.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Avatar photo={contact?.photo} name={contact?.name} size={40} />
            )}
            <div className="min-w-0">
              <p className={`text-[15px] font-semibold truncate ${headerText}`}>{title}</p>
              <p className={`text-[12px] truncate ${headerSub}`}>{subtitle}</p>
            </div>
          </div>

          {chatType === "team" && (
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`p-2 rounded-lg transition-colors shrink-0 ${showInfo ? "bg-indigo-50 text-indigo-600" : iconBtn}`}
              title="Group info"
            >
              {showInfo ? <X size={18} /> : <Info size={18} />}
            </button>
          )}
        </div>

        {/* Message list */}
        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 ${bodyBg}`}>
          {chatType !== "ai" && (isResolvingChat || isLoadingMessages) ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Loader2 size={22} className="animate-spin text-indigo-500" />
              <p className={`text-[13px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {isResolvingChat ? "Setting up chat…" : "Loading messages…"}
              </p>
            </div>
          ) : chatType !== "ai" && (resolveError || messagesError) ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <AlertCircle size={22} className={isDark ? "text-red-400" : "text-red-500"} />
              <p className={`text-[13px] ${isDark ? "text-red-300" : "text-red-600"}`}>{resolveError || messagesError}</p>
              <button
                onClick={resolveError ? () => setResolveAttempt((n) => n + 1) : loadTeamOrDmMessages}
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <MessageCircle size={22} className={isDark ? "text-gray-600" : "text-gray-300"} />
              <p className={`text-[13px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble
                  key={m._id ?? i}
                  message={m}
                  isMe={m.senderId === user._id}
                  isAiSender={m.senderId === "ai_assistant"}
                  showSenderName={chatType === "team" || chatType === "ai"}
                  isDark={isDark}
                />
              ))}
              {isThinking && <TypingIndicator label="AI Assistant" isDark={isDark} />}
            </>
          )}
          <div ref={scrollRef} />
        </div>

        {/* AI error banner */}
        {chatType === "ai" && chatError && (
          <div className={`flex items-center gap-2 px-5 py-2 text-[13px] border-t shrink-0 ${isDark ? "text-red-300 bg-red-950/30 border-red-900" : "text-red-600 bg-red-50 border-red-100"}`}>
            <AlertCircle size={14} className="shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        {/* Input bar */}
        <div className={`flex items-end gap-2 px-4 py-3 border-t shrink-0 ${headerBg} ${headerBorder}`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={chatType === "ai" && (isThinking || !canChatWithAi)}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              chatType === "ai"
                ? canChatWithAi
                  ? "Ask about a ticket, task, or stock level…"
                  : "Log in with a company to chat with the assistant"
                : "Type a message…"
            }
            className={`flex-1 resize-none max-h-[120px] rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 disabled:opacity-50 ${
              isDark ? "bg-[#1a1f2e] border-[#1e2336] text-gray-100 placeholder:text-gray-500" : "bg-white border-gray-300 text-gray-900"
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || (chatType === "ai" && (isThinking || !canChatWithAi))}
            className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {chatType === "ai" && isThinking ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {/* Group info side panel */}
      {chatType === "team" && showInfo && (
        <div className={`w-[280px] shrink-0 border-l flex flex-col ${isDark ? "bg-[#0f1117] border-[#1e2336]" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3.5 border-b flex items-center gap-2 ${isDark ? "border-[#1e2336]" : "border-gray-200"}`}>
            <Users size={16} className="text-indigo-500" />
            <span className={`text-sm font-semibold ${headerText}`}>Group members</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {team?.description && (
              <p className={`text-[12.5px] px-1 pb-3 mb-2 border-b ${isDark ? "text-gray-400 border-[#1e2336]" : "text-gray-500 border-gray-100"}`}>
                {team.description}
              </p>
            )}
            {(team?.members ?? []).filter((m) => m?.user).map((m, idx) => {
              const memberUser = m.user;
              const isMe = memberUser._id === user._id;
              return (
                <div
                  key={memberUser._id ?? idx}
                  role={isMe ? undefined : "button"}
                  tabIndex={isMe ? undefined : 0}
                  onClick={() => !isMe && onStartDM?.(memberUser)}
                  onKeyDown={(e) => !isMe && e.key === "Enter" && onStartDM?.(memberUser)}
                  className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${
                    isMe ? "" : isDark ? "hover:bg-[#1a1f2e] cursor-pointer" : "hover:bg-gray-50 cursor-pointer"
                  }`}
                  title={isMe ? "You" : `Message ${memberUser.name}`}
                >
                  <Avatar photo={memberUser.photo} name={memberUser.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold truncate ${headerText}`}>{isMe ? "You" : memberUser.name}</p>
                    <p className={`text-[11px] truncate ${headerSub}`}>{memberUser.email}</p>
                  </div>
                  {m.role === "admin" && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-600"}`}>
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
            {(team?.members ?? []).length === 0 && (
              <p className={`text-[12.5px] text-center py-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}>No members in this group yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
