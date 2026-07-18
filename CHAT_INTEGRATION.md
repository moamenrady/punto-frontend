# 🤖 AI Integration Prompt — Chat System
# =========================================
# استخدم هذا الملف كـ context لأي AI تريد مساعدته في ربط نظام الشات بمشروعك الجديد.
# انسخ محتوى هذا الملف كاملاً وأرسله للـ AI مع طلبك.
# =========================================

---

## 📌 السياق العام

هذا الملف يحتوي على التوثيق الكامل لنظام الشات (Chat System) المستخرج من مشروع قديم (Punto Backend).
المطلوب هو دمج هذا النظام في مشروع جديد مع الحفاظ على نفس البنية والمنطق.

المشروع القديم يستخدم: **Node.js + Express + MongoDB (Mongoose) + Socket.IO**

---

## 🗄️ قاعدة البيانات — Models

### 1. Chat Model

```javascript
// models/chatModel.js
const mongoose = require("mongoose");
const Counter = require("./Counter"); // نموذج عداد للـ custom IDs

const chatSchema = new mongoose.Schema(
  {
    custom_id: { type: String, unique: true },         // auto: "cht_1", "cht_2" ...
    type: {
      type: String,
      enum: ["group", "private"],
      required: true,
    },
    name: { type: String, trim: true },                // اسم الغرفة (للـ groups)
    description: String,
    avatar: {
      data: Buffer,
      contentType: String,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    last_message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto Custom ID
chatSchema.pre("save", async function () {
  if (this.custom_id) return;
  const counter = await Counter.findOneAndUpdate(
    { name: "chat" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.custom_id = `cht_${counter.seq}`;
});

module.exports = mongoose.model("Chat", chatSchema);
```

---

### 2. Message Model

```javascript
// models/Message.js
const mongoose = require("mongoose");
const Counter = require("./Counter");

const messageSchema = new mongoose.Schema(
  {
    custom_id: { type: String, unique: true },         // auto: "msg_1", "msg_2" ...

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    content: { type: String, trim: true },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        type: String,
        size: Number,
        name: String,
      },
    ],
    reply_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    edited: { type: Boolean, default: false },
    deleted_for_everyone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto Custom ID
messageSchema.pre("save", async function () {
  if (this.custom_id) return;
  const counter = await Counter.findOneAndUpdate(
    { name: "message" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.custom_id = `msg_${counter.seq}`;
});

// Index للـ pagination السريع
messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
```

---

### 3. ChatMember Model

```javascript
// models/ChatMember.js
const mongoose = require("mongoose");
const Counter = require("./Counter");

const chatMemberSchema = new mongoose.Schema(
  {
    custom_id: { type: String, unique: true },         // auto: "cm_1", "cm_2" ...

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joined_at: { type: Date, default: Date.now },
    last_read_message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    muted: { type: Boolean, default: false },
    left_at: Date,
  },
  { timestamps: true }
);

// Indexes
chatMemberSchema.index({ chat: 1, user: 1 }, { unique: true });
chatMemberSchema.index({ user: 1 });

// Auto Custom ID
chatMemberSchema.pre("save", async function () {
  if (this.custom_id) return;
  const counter = await Counter.findOneAndUpdate(
    { name: "chatmember" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.custom_id = `cm_${counter.seq}`;
});

module.exports = mongoose.model("ChatMember", chatMemberSchema);
```

---

### 4. Counter Model (مطلوب للـ Custom IDs)

```javascript
// models/Counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
```

---

## 📡 REST API Endpoints

**Base URL**: `/api/v1/messages`
**Auth**: يتطلب `Authorization: Bearer <JWT_TOKEN>` في كل الطلبات.
**Feature Gate**: يتطلب أن يكون `"Chat System"` مفعّلاً في الـ Plan الخاص بالمستخدم.

---

### GET `/api/v1/messages/:chatId`

جيب كل الرسائل الخاصة بـ chat.

**الـ chatId ممكن يكون:**
- **MongoDB ObjectId**: يبحث في `teamId` أو `chatId` (backward compat)
- **String بـ underscore** مثل `userId1_userId2`: للـ DMs القديمة

**كود التنفيذ:**
```javascript
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(chatId);

    let query = isValidObjectId
      ? { $or: [{ teamId: chatId }, { chatId: chatId }] }
      : { chatId: chatId };

    const messages = await Message.find(query);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Response 200:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "custom_id": "msg_42",
    "chat": "64f1a2b3c4d5e6f7a8b9c0d2",
    "sender": "64f1a2b3c4d5e6f7a8b9c0d3",
    "company_id": "64f1a2b3c4d5e6f7a8b9c0d4",
    "content": "Hello World!",
    "type": "text",
    "attachments": [],
    "reply_to": null,
    "edited": false,
    "deleted_for_everyone": false,
    "createdAt": "2024-06-01T12:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z"
  }
]
```

---

### GET `/api/v1/messages/dms/user/:userId`

جيب قائمة المستخدمين اللي اتكلمت معاهم في الـ Direct Messages.

**كود التنفيذ:**
```javascript
router.get('/dms/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      chatId: { $regex: userId }
    });

    const dmUserIds = new Set();
    messages.forEach(msg => {
      if (msg.chatId && msg.chatId.includes('_')) {
        const ids = msg.chatId.split('_');
        const otherId = ids[0] === userId ? ids[1] : ids[0];
        if (otherId && otherId.length === 24) dmUserIds.add(otherId);
      }
    });

    const users = await User.find({ _id: { $in: Array.from(dmUserIds) } })
      .select('name email photo role');

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Response 200:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
    "name": "Ahmed Mohamed",
    "email": "ahmed@example.com",
    "photo": "uploads/photo.jpg",
    "role": "developer"
  }
]
```

---

## 🆕 Group & Individual Chats — Endpoints الناقصة

**Base URL**: `/api/v1/chats`
هذه الـ endpoints تستخدم موديلات `Chat` و `ChatMember` (اللي متعرّفة فوق بس مكنتش مستخدمة في أي route) عشان تتيح إنشاء جروبات وشاتات فردية حقيقية، مش الـ string-based `chatId` القديم.

---

### POST `/api/v1/chats/group`

إنشاء جروب شات جديد (Team Chat) بأعضاء متعددين.

**Body:**
```json
{ "name": "Frontend Team", "description": "نقاش المشروع", "member_ids": ["64f1...d3", "64f1...d5"] }
```

**كود التنفيذ:**
```javascript
router.post('/group', async (req, res) => {
  try {
    const { name, description, member_ids } = req.body;
    if (!name || !Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({ error: 'name و member_ids مطلوبين' });
    }

    const chat = await Chat.create({
      type: 'group',
      name,
      description,
      created_by: req.user._id,
      company_id: req.user.company_id,
    });

    const allMemberIds = [...new Set([req.user._id.toString(), ...member_ids])];
    await ChatMember.insertMany(
      allMemberIds.map((userId) => ({
        chat: chat._id,
        user: userId,
        company_id: req.user.company_id,
        role: userId === req.user._id.toString() ? 'admin' : 'member',
      }))
    );

    allMemberIds.forEach((userId) => req.app.get('io')?.to(`user_${userId}`).emit('new_chat', chat));

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### POST `/api/v1/chats/private`

فتح شات فردي (1:1) مع عضو تاني — لو موجود بالفعل بيرجعه، لو لأ بينشئه.

**Body:**
```json
{ "user_id": "64f1a2b3c4d5e6f7a8b9c0d5" }
```

**كود التنفيذ:**
```javascript
router.post('/private', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id مطلوب' });

    const myChats = await ChatMember.find({ user: req.user._id }).distinct('chat');
    const theirChats = await ChatMember.find({ user: user_id, chat: { $in: myChats } }).distinct('chat');
    const existing = await Chat.findOne({ _id: { $in: theirChats }, type: 'private' });
    if (existing) return res.json(existing);

    const chat = await Chat.create({
      type: 'private',
      created_by: req.user._id,
      company_id: req.user.company_id,
    });

    await ChatMember.insertMany([
      { chat: chat._id, user: req.user._id, company_id: req.user.company_id, role: 'member' },
      { chat: chat._id, user: user_id, company_id: req.user.company_id, role: 'member' },
    ]);

    req.app.get('io')?.to(`user_${user_id}`).emit('new_chat', chat);

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### GET `/api/v1/chats`

جيب كل الشاتات (جروبات + أفراد) اللي اليوزر الحالي عضو فيها، مع آخر رسالة.

**كود التنفيذ:**
```javascript
router.get('/', async (req, res) => {
  try {
    const memberships = await ChatMember.find({ user: req.user._id, left_at: null })
      .populate({ path: 'chat', match: { is_deleted: false }, populate: { path: 'last_message' } });

    const chats = await Promise.all(
      memberships.filter((m) => m.chat).map(async (m) => {
        const chat = m.chat.toObject();
        if (chat.type === 'private') {
          const other = await ChatMember.findOne({ chat: chat._id, user: { $ne: req.user._id } })
            .populate('user', 'name email photo role');
          chat.other_user = other ? other.user : null;
        } else {
          chat.members_count = await ChatMember.countDocuments({ chat: chat._id, left_at: null });
        }
        return chat;
      })
    );

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### GET `/api/v1/chats/:chatId/members`

جيب أعضاء الجروب.

```javascript
router.get('/:chatId/members', async (req, res) => {
  try {
    const members = await ChatMember.find({ chat: req.params.chatId, left_at: null })
      .populate('user', 'name email photo role');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### POST `/api/v1/chats/:chatId/members`

إضافة أعضاء لجروب موجود (لازم تكون `admin` في الشات).

**Body:** `{ "member_ids": ["64f1...d6"] }`

```javascript
router.post('/:chatId/members', async (req, res) => {
  try {
    const { member_ids } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || chat.type !== 'group') return res.status(404).json({ error: 'Group chat غير موجود' });

    const requester = await ChatMember.findOne({ chat: chat._id, user: req.user._id });
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'مسموح فقط للـ admin بإضافة أعضاء' });
    }

    const added = await ChatMember.insertMany(
      member_ids.map((userId) => ({ chat: chat._id, user: userId, company_id: chat.company_id, role: 'member' })),
      { ordered: false }
    ).catch(() => []); // تجاهل أي عضو مكرر (unique index على chat+user)

    const io = req.app.get('io');
    member_ids.forEach((userId) => io?.to(`user_${userId}`).emit('new_chat', chat));
    io?.to(chat._id.toString()).emit('members_added', { chatId: chat._id, member_ids });

    res.status(201).json(added);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### DELETE `/api/v1/chats/:chatId/members/:userId`

إزالة عضو (أو مغادرة الجروب لو المستخدم بيشيل نفسه).

```javascript
router.delete('/:chatId/members/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const isSelf = userId === req.user._id.toString();

    if (!isSelf) {
      const requester = await ChatMember.findOne({ chat: chatId, user: req.user._id });
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'مسموح فقط للـ admin بإزالة أعضاء' });
      }
    }

    await ChatMember.findOneAndUpdate({ chat: chatId, user: userId }, { left_at: new Date() });
    req.app.get('io')?.to(chatId).emit('member_removed', { chatId, userId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### GET `/api/v1/chats/:chatId/messages`

جيب رسائل شات معيّن (جروب أو فردي) باستخدام موديل `Message` الفعلي (`chat`, `sender`, `content`) بدل الـ `chatId` القديم — ده الـ endpoint اللي المفروض تستخدمه لعرض المحادثة.

```javascript
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 30, skip = 0 } = req.query;

    const isMember = await ChatMember.exists({ chat: chatId, user: req.user._id });
    if (!isMember) return res.status(403).json({ error: 'مش عضو في الشات ده' });

    const messages = await Message.find({ chat: chatId, deleted_for_everyone: false })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('sender', 'name email photo')
      .populate('reply_to');

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### POST `/api/v1/messages` *(إضافة على نفس ملف `routes/messages.js` الموجود)*

إرسال رسالة فعلية (لجروب أو لفرد) باستخدام موديل `Message` الحقيقي — الـ endpoints القديمة فوق (`GET /:chatId`, `send_message` بالسوكيت) كانت بتحفظ بحقول `chatId/senderId/text` اللي مش موجودة أصلاً في `messageSchema`. الـ endpoint ده متسق مع الموديل الحقيقي.

```javascript
router.post('/', async (req, res) => {
  try {
    const { chat: chatId, content, type = 'text', attachments = [], reply_to } = req.body;

    const isMember = await ChatMember.exists({ chat: chatId, user: req.user._id });
    if (!isMember) return res.status(403).json({ error: 'مش عضو في الشات ده' });

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      company_id: req.user.company_id,
      content,
      type,
      attachments,
      reply_to,
    });

    await Chat.findByIdAndUpdate(chatId, { last_message: message._id });

    const populated = await message.populate('sender', 'name email photo');
    req.app.get('io')?.to(chatId).emit('receive_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

> ⚠️ عشان `req.app.get('io')` يشتغل، لازم تعمل `app.set('io', io)` في `app.js` بعد إنشاء الـ Socket.IO server (شوف قسم "🗂️ Routes Registration" تحت).

---

## 🔌 Socket.IO Events

**Connection URL**: نفس الـ HTTP port (مثلاً `ws://localhost:5000`)

**Setup:**
```javascript
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});
```

### Client → Server

| Event | Payload | الوظيفة |
|-------|---------|---------|
| `join_chat` | `chatId: string` | انضم لغرفة الشات |
| `join_team` | `teamId: string` | backward compat |
| `send_message` | `{ chatId, teamId, senderId, senderName, text }` | ابعت رسالة |
| `create_group_chat` 🆕 | `{ name, description, member_ids }` | إنشاء جروب جديد |
| `create_private_chat` 🆕 | `{ user_id }` | فتح/إنشاء شات فردي مع مستخدم |

```javascript
// انضم للشات
socket.emit("join_chat", "CHAT_ID_HERE");

// ابعت رسالة
socket.emit("send_message", {
  chatId: "64f1a2b3c4d5e6f7a8b9c0d2",
  teamId: null,
  senderId: "64f1a2b3c4d5e6f7a8b9c0d3",
  senderName: "Ahmed",
  text: "Hello World!"
});
```

### Server → Client

| Event | Payload | الوظيفة |
|-------|---------|---------|
| `receive_message` | `message object` | رسالة جديدة وصلت |
| `new_chat` 🆕 | `chat object` | شات جديد (جروب أو فردي) اتعمل وانت عضو فيه |
| `members_added` 🆕 | `{ chatId, member_ids }` | أعضاء جدد انضموا للجروب |
| `member_removed` 🆕 | `{ chatId, userId }` | عضو اتشال أو غادر الجروب |

```javascript
socket.on("receive_message", (message) => {
  // أضف الرسالة للـ UI
  console.log(message.text, message.senderName);
});
```

**كود الـ Backend:**
```javascript
io.on("connection", (socket) => {
  socket.on("join_chat", (chatId) => socket.join(chatId));
  socket.on("join_team", (teamId) => socket.join(teamId));

  socket.on("send_message", async (data) => {
    const { teamId, chatId, senderId, senderName, text } = data;
    const room = chatId || teamId;

    const savedMessage = await Message.create({
      teamId: teamId || undefined,
      chatId: room,
      senderId,
      senderName,
      text,
    });

    io.to(room).emit("receive_message", savedMessage);
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});
```

### 🆕 Group & Individual Chat Events (إضافات على نفس الـ `io.on("connection", ...)` فوق)

ضيف الأسطر دي جوه نفس الـ connection handler الموجود فوق (مش handler تاني منفصل):

```javascript
// auto-join كل الشاتات (جروبات + أفراد) بتاعة اليوزر عند الاتصال
const userId = socket.handshake.auth?.userId; // أو استخرجه من الـ JWT في الـ middleware
if (userId) {
  socket.join(`user_${userId}`); // غرفة شخصية للإشعارات زي new_chat
  const myChats = await ChatMember.find({ user: userId, left_at: null }).distinct("chat");
  myChats.forEach((chatId) => socket.join(chatId.toString()));
}

// إنشاء جروب جديد
socket.on("create_group_chat", async ({ name, description, member_ids }, callback) => {
  const chat = await Chat.create({
    type: "group",
    name,
    description,
    created_by: userId,
    company_id: socket.handshake.auth?.companyId,
  });

  const allMembers = [...new Set([userId, ...member_ids])];
  await ChatMember.insertMany(
    allMembers.map((uid) => ({
      chat: chat._id,
      user: uid,
      company_id: chat.company_id,
      role: uid === userId ? "admin" : "member",
    }))
  );

  allMembers.forEach((uid) => io.to(`user_${uid}`).emit("new_chat", chat));
  socket.join(chat._id.toString());
  callback?.(chat);
});

// فتح/إنشاء شات فردي مع عضو تاني
socket.on("create_private_chat", async ({ user_id }, callback) => {
  const myChats = await ChatMember.find({ user: userId }).distinct("chat");
  const theirChats = await ChatMember.find({ user: user_id, chat: { $in: myChats } }).distinct("chat");
  let chat = await Chat.findOne({ _id: { $in: theirChats }, type: "private" });

  if (!chat) {
    chat = await Chat.create({ type: "private", created_by: userId, company_id: socket.handshake.auth?.companyId });
    await ChatMember.insertMany([
      { chat: chat._id, user: userId, company_id: chat.company_id },
      { chat: chat._id, user: user_id, company_id: chat.company_id },
    ]);
  }

  socket.join(chat._id.toString());
  io.to(`user_${user_id}`).emit("new_chat", chat);
  callback?.(chat);
});
```

> 💡 **ملحوظة على الـ Auth:** الكود بيفترض إنك بتبعت `userId` (و `companyId`) في `socket.handshake.auth` وقت الاتصال من الـ frontend:
> ```javascript
> const socket = io("http://localhost:5000", { auth: { userId: currentUser._id, companyId: currentUser.company_id } });
> ```
> لو عندك middleware بيتحقق من الـ JWT في الـ socket، استخرج الـ `userId` منه بدل الاعتماد على `handshake.auth` مباشرة.

---

## 🗂️ Routes Registration

```javascript
// app.js
const messages = require("./routes/messages");
app.use("/api/v1/messages", messages);
```

```javascript
// routes/messages.js — complete file
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authController = require('../controllers/authController');

router.use(authController.protect);
router.use(authController.checkFeature("Chat System")); // أزل إذا مش محتاج feature flags

router.get('/dms/user/:userId', async (req, res) => { /* ... كود فوق ... */ });
router.get('/:chatId', async (req, res) => { /* ... كود فوق ... */ });

module.exports = router;
```

> 🆕 **إضافة لنفس الملف:** ضيف `router.post('/', async (req, res) => { /* ... كود POST /api/v1/messages فوق ... */ });` جوه `routes/messages.js` عشان إرسال الرسائل الفعلي.

### 🆕 تسجيل شاتات الجروبات والأفراد (`routes/chats.js`)

```javascript
// app.js
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.set("io", io); // عشان أي route (chats.js أو messages.js) توصل لـ req.app.get('io')

const chats = require("./routes/chats");
app.use("/api/v1/chats", chats);
```

```javascript
// routes/chats.js — complete file
const express = require("express");
const router = express.Router();
const Chat = require("../models/chatModel");
const Message = require("../models/Message");
const ChatMember = require("../models/ChatMember");
const authController = require("../controllers/authController");

router.use(authController.protect);
router.use(authController.checkFeature("Chat System")); // أزل إذا مش محتاج

router.post('/group', async (req, res) => { /* ... كود فوق ... */ });
router.post('/private', async (req, res) => { /* ... كود فوق ... */ });
router.get('/', async (req, res) => { /* ... كود فوق ... */ });
router.get('/:chatId/members', async (req, res) => { /* ... كود فوق ... */ });
router.post('/:chatId/members', async (req, res) => { /* ... كود فوق ... */ });
router.delete('/:chatId/members/:userId', async (req, res) => { /* ... كود فوق ... */ });
router.get('/:chatId/messages', async (req, res) => { /* ... كود فوق ... */ });

module.exports = router;
```

---

## 📦 Dependencies

```bash
npm install socket.io mongoose express
```

---

## ⚡ تعليمات الدمج للـ AI

**يا AI:** المطلوب دمج نظام الشات الموثق في هذا الملف مع المشروع الجديد. اتبع هذه الخطوات:

1. **Models** — أنشئ الـ 4 ملفات: `Chat`, `Message`, `ChatMember`, `Counter`
2. **Routes** — أنشئ `routes/messages.js` وسجّله في `app.js` على `/api/v1/messages`
3. **Socket.IO** — أضف Socket.IO للـ server وادمج الـ events مع الكود الموجود
4. **Auth** — اربط الـ auth middleware المناسب (أزل `checkFeature` إذا مش مطلوب)
5. **Frontend** — استخدم مثال الكود أدناه للتكامل مع الـ frontend
6. **Groups & Individuals** 🆕 — أنشئ `routes/chats.js` (قسم "🆕 Group & Individual Chats" فوق) وسجّله على `/api/v1/chats` عشان إنشاء الجروبات والشاتات الفردية وإدارة الأعضاء

**مثال Frontend (React):**
```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

// انضم للشات وجيب الرسائل القديمة
useEffect(() => {
  socket.emit("join_chat", chatId);

  fetch(`/api/v1/messages/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json()).then(setMessages);

  socket.on("receive_message", (msg) => {
    setMessages(prev => [...prev, msg]);
  });

  return () => socket.off("receive_message");
}, [chatId]);

// ابعت رسالة
const sendMessage = (text) => {
  socket.emit("send_message", {
    chatId,
    senderId: currentUser._id,
    senderName: currentUser.name,
    text
  });
};
```

**🆕 مثال Frontend — جروبات وشاتات فردية:**
```javascript
// جيب كل شاتاتي (جروبات + أفراد)
const loadMyChats = async () => {
  const res = await fetch('/api/v1/chats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json(); // كل عنصر فيه chat.type = "group" أو "private"، و chat.other_user لو private
};

// اعمل جروب جديد مع أعضاء الفريق
const createGroupChat = async (name, memberIds) => {
  const res = await fetch('/api/v1/chats/group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, member_ids: memberIds })
  });
  return res.json();
};

// افتح شات فردي مع عضو معين في الفريق
const openPrivateChat = async (userId) => {
  const res = await fetch('/api/v1/chats/private', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId })
  });
  return res.json();
};

// ابعت رسالة (لجروب أو لفرد) بالـ REST — بديل لـ send_message بالسوكيت
const sendChatMessage = async (chatId, content) => {
  const res = await fetch('/api/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ chat: chatId, content })
  });
  return res.json();
};

// استقبل إشعار "شات جديد اتضاف ليه" (جروب جديد أو حد فتح شات فردي معاك)
useEffect(() => {
  socket.on("new_chat", (chat) => setChats((prev) => [chat, ...prev]));
  return () => socket.off("new_chat");
}, []);
```

---

## ⚠️ ملاحظات مهمة

1. **DM Format القديم**: `chatId = "userId1_userId2"` — إذا المشروع الجديد بيستخدم ObjectId، هتحتاج تعيد بناء منطق الـ DMs.
2. **Feature Flag**: أزل `checkFeature("Chat System")` إذا مش موجود في المشروع الجديد.
3. **File Uploads**: مفيش endpoint لرفع الملفات — هتحتاج تضيفه إذا محتاج `attachments`.
4. **Pagination**: الكود الحالي بيجيب كل الرسائل — يُنصح بإضافة `limit` و `skip`.
5. **Backward Compat**: `teamId` في الـ messages للـ teams القديمة — يمكن حذفه في المشروع الجديد.
6. **Groups & Individuals** 🆕: الموديلات `Chat`/`ChatMember` كانت متعرّفة من الأول بس من غير أي route بيستخدمها — استخدم قسم "🆕 Group & Individual Chats" فوق عشان تقدر تعمل جروبات فريق حقيقية وتفتح شاتات فردية مع كل عضو، بدل الاعتماد على الـ `chatId` كـ string.
7. **Membership Check** 🆕: كل الـ endpoints الجديدة بتتأكد إن اليوزر عضو فعلي في الـ `ChatMember` قبل ما يقرا/يبعت رسائل — لازم تتأكد إن `req.user._id` و `req.user.company_id` موجودين من الـ auth middleware بتاعك.
