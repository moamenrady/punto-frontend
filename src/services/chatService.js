// chatService.js
//
// Thin service layer around the realtime chat backend used by
// GroupChatPage / ChatWindow. Centralizes the socket.io connection and the
// REST call for message history so the UI components stay focused on
// rendering instead of wiring up transports.
//
// Backend contract (unchanged from the previous chat implementation):
//   - REST:   GET  /api/v1/messages/:chatId  -> Message[]
//   - Socket: emit  'join_chat'      (chatId)
//             emit  'send_message'   ({ chatId, teamId?, senderId, senderName, text })
//             on    'receive_message' (Message)
//
// NOTE on Direct Message ids: this backend keys everything off a single
// `chatId`. For group chats that's simply the team's _id. For 1‑on‑1 DMs
// there is no dedicated "create conversation" endpoint documented, so we
// derive a deterministic room id by sorting + joining both user ids. Both
// participants compute the same id, so the DM "just works" symmetrically.
// If the backend later exposes a real conversation/thread id, swap the
// implementation of `getDmChatId` below and nothing else needs to change.

import axios from "axios";
import io from "socket.io-client";

export const CHAT_BASE_URL = "https://punto-production-21ed.up.railway.app";

let socketInstance = null;
let lastAuthToken = null;

/** Reads the current auth token the same way the rest of the app does. */
function getAuthToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

/** Standard Authorization header for REST calls against the chat backend. */
function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Returns the shared socket.io connection, creating it on first use.
 * The connection carries the same bearer token used for REST calls (both
 * as the socket.io `auth` payload and as an Authorization header for the
 * polling transport fallback) — without it the backend treats the socket
 * as unauthenticated. If the token changes (login/logout) the existing
 * socket is reconnected with the fresh token instead of silently going stale.
 */
export function getSocket() {
  const token = getAuthToken();

  if (!socketInstance) {
    socketInstance = io(CHAT_BASE_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      auth: token ? { token } : {},
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    lastAuthToken = token;
  } else if (token !== lastAuthToken) {
    socketInstance.auth = token ? { token } : {};
    lastAuthToken = token;
    socketInstance.disconnect().connect();
  }

  return socketInstance;
}

/** Deterministic room id for a 1-on-1 chat between two user ids. */
export function getDmChatId(userIdA, userIdB) {
  return ["dm", ...[String(userIdA), String(userIdB)].sort()].join("_");
}

/**
 * Fetches message history for a given chat (team or DM) room.
 * Throws a readable Error on failure so callers can show fallback UI.
 */
export async function fetchMessages(chatId) {
  try {
    const { data } = await axios.get(`${CHAT_BASE_URL}/api/v1/messages/${chatId}`, {
      headers: authHeaders(),
    });
    if (Array.isArray(data)) return data;
    return data?.data ?? data?.messages ?? [];
  } catch (err) {
    const serverMsg = err?.response?.data?.message;
    throw new Error(serverMsg || "Couldn't load messages for this chat. Please try again.");
  }
}

/** Joins the socket room for a chat so this client receives its messages. */
export function joinChat(chatId) {
  if (!chatId) return;
  getSocket().emit("join_chat", chatId);
}

/**
 * Leaves the socket room for a chat. Called whenever the user switches to a
 * different group/DM so a user who belongs to several teams doesn't keep
 * receiving (or risk mis-attributing) messages from teams they're no longer
 * looking at. Safe to call even if the server doesn't implement a
 * 'leave_chat' handler — it's just an unused event in that case.
 */
export function leaveChat(chatId) {
  if (!chatId) return;
  getSocket().emit("leave_chat", chatId);
}

/** Sends a message over the socket connection. */
export function sendSocketMessage({ chatId, teamId, senderId, senderName, text }) {
  getSocket().emit("send_message", { chatId, teamId, senderId, senderName, text });
}

/** Subscribes to incoming messages; returns an unsubscribe function. */
export function onReceiveMessage(handler) {
  const socket = getSocket();
  socket.on("receive_message", handler);
  return () => socket.off("receive_message", handler);
}

export default {
  getSocket,
  getDmChatId,
  fetchMessages,
  joinChat,
  leaveChat,
  sendSocketMessage,
  onReceiveMessage,
};
