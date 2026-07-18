// chatService.js
//
// Thin service layer around the realtime chat backend used by
// GroupChatPage / ChatWindow. Centralizes the socket.io connection and the
// REST calls for group/DM chats + message history so the UI components stay
// focused on rendering instead of wiring up transports.
//
// Backend contract (see CHAT_INTEGRATION.md — "Group & Individual Chats"):
//   - REST:   GET    /api/v1/chats                    -> Chat[] (groups + DMs I'm a member of)
//             POST   /api/v1/chats/group               -> Chat   ({ name, description, member_ids })
//             POST   /api/v1/chats/private              -> Chat   ({ user_id })  (idempotent)
//             GET    /api/v1/chats/:chatId/messages     -> Message[]
//             POST   /api/v1/messages                   -> Message ({ chat, content, type?, attachments?, reply_to? })
//   - Socket: emit  'join_chat'      (chatId)
//             emit  'leave_chat'     (chatId)
//             on    'receive_message' (Message)
//             on    'new_chat'        (Chat)   — a group/DM you were just added to
//
// Group chats are keyed off the Team a user belongs to (there's no 1:1 link
// between a Team and a Chat document on the backend), and DMs are keyed off
// the other user's id. `resolveTeamChatId` / `resolveDmChatId` find-or-create
// the underlying Chat document and cache the mapping so we don't hit the
// "create" endpoint more than once per team/contact.

import axios from "axios";
import io from "socket.io-client";

export const CHAT_BASE_URL = "https://punto-production-21ed.up.railway.app";
const CHATS_URL = `${CHAT_BASE_URL}/api/v1/chats`;
const MESSAGES_URL = `${CHAT_BASE_URL}/api/v1/messages`;

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

function apiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || fallback;
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

// ── Chat resolution cache (team/contact -> real Chat _id) ──────────────────
// Persisted per logged-in user so we don't re-create a group/DM chat on
// every page load — but always double-checked against `fetchMyChats()`
// first, since that's the source of truth.
function cacheKeyFor(userId) {
  return `chat_id_map_${userId || "anon"}`;
}

function readChatIdCache(userId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKeyFor(userId))) || {};
  } catch {
    return {};
  }
}

function writeChatIdCache(userId, map) {
  try {
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(map));
  } catch {
    /* non-fatal — resolution just falls back to hitting the API again */
  }
}

/** Fetches every group + DM chat the logged-in user belongs to. */
export async function fetchMyChats() {
  try {
    const { data } = await axios.get(CHATS_URL, { headers: authHeaders() });
    if (Array.isArray(data)) return data;
    return data?.data ?? data?.chats ?? [];
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Couldn't load your chats. Please try again."));
  }
}

/** Creates a new group chat. `member_ids` should exclude the creator. */
export async function createGroupChat({ name, description, member_ids }) {
  try {
    const { data } = await axios.post(
      `${CHATS_URL}/group`,
      { name, description, member_ids },
      { headers: authHeaders() }
    );
    return data?.data ?? data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Couldn't create the group chat."));
  }
}

/** Gets (or creates) the 1:1 chat with another user. Safe to call repeatedly. */
export async function createPrivateChat(userId) {
  try {
    const { data } = await axios.post(`${CHATS_URL}/private`, { user_id: userId }, { headers: authHeaders() });
    return data?.data ?? data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Couldn't open that conversation."));
  }
}

/**
 * Finds (or creates) the real Chat document backing a Team's group chat, and
 * caches the mapping. Throws a readable error if the team has no other
 * members yet (the backend requires at least one member besides the creator).
 */
export async function resolveTeamChatId(team, myUserId) {
  if (!team?._id) return null;

  const cache = readChatIdCache(myUserId);
  const cacheKey = `team_${team._id}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const chats = await fetchMyChats();
  let chat = chats.find((c) => c.type === "group" && c.name === team.name);

  if (!chat) {
    const memberIds = (team.members ?? [])
      .map((m) => m?.user?._id ?? m?.user ?? m?._id ?? m)
      .filter((id) => id && String(id) !== String(myUserId));

    if (memberIds.length === 0) {
      throw new Error("Add another member to this team before you can start its group chat.");
    }

    chat = await createGroupChat({ name: team.name, description: team.description, member_ids: memberIds });
  }

  cache[cacheKey] = chat._id;
  writeChatIdCache(myUserId, cache);
  return chat._id;
}

/** Finds (or creates) the real Chat document backing a 1:1 DM, and caches the mapping. */
export async function resolveDmChatId(contact, myUserId) {
  if (!contact?._id) return null;

  const cache = readChatIdCache(myUserId);
  const cacheKey = `dm_${contact._id}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const chats = await fetchMyChats();
  let chat = chats.find(
    (c) => c.type === "private" && String(c.other_user?._id ?? c.other_user ?? "") === String(contact._id)
  );

  if (!chat) {
    chat = await createPrivateChat(contact._id);
  }

  cache[cacheKey] = chat._id;
  writeChatIdCache(myUserId, cache);
  return chat._id;
}

/**
 * Fetches message history for a given (real) chat id.
 * Throws a readable Error on failure so callers can show fallback UI.
 */
export async function fetchChatMessages(chatId, { limit = 50, skip = 0 } = {}) {
  try {
    const { data } = await axios.get(`${CHATS_URL}/${chatId}/messages`, {
      headers: authHeaders(),
      params: { limit, skip },
    });
    if (Array.isArray(data)) return data;
    return data?.data ?? data?.messages ?? [];
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Couldn't load messages for this chat. Please try again."));
  }
}

/**
 * Sends a message via REST and resolves with the server-confirmed message
 * (populated sender included). Preferred over the socket-only send because
 * it doesn't depend on the server echoing the message back to the sender.
 */
export async function sendMessage({ chat, content, type = "text", attachments, reply_to }) {
  try {
    const { data } = await axios.post(
      MESSAGES_URL,
      { chat, content, type, attachments, reply_to },
      { headers: authHeaders() }
    );
    return data?.data ?? data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, "Couldn't send that message. Please try again."));
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

/** Subscribes to incoming messages; returns an unsubscribe function. */
export function onReceiveMessage(handler) {
  const socket = getSocket();
  socket.on("receive_message", handler);
  return () => socket.off("receive_message", handler);
}

/** Subscribes to "you were added to a chat" notifications; returns an unsubscribe function. */
export function onNewChat(handler) {
  const socket = getSocket();
  socket.on("new_chat", handler);
  return () => socket.off("new_chat", handler);
}

export default {
  getSocket,
  fetchMyChats,
  createGroupChat,
  createPrivateChat,
  resolveTeamChatId,
  resolveDmChatId,
  fetchChatMessages,
  sendMessage,
  joinChat,
  leaveChat,
  onReceiveMessage,
  onNewChat,
};
