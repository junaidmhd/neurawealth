const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  at: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New conversation" },
  messages: [messageSchema],
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

async function list(userId) {
  const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
  return chats.map(({ messages, ...meta }) => ({ ...meta, _id: meta._id.toString(), count: messages.length }));
}

async function get(id, userId) {
  const chat = await Chat.findOne({ _id: id, userId }).lean();
  if (!chat) return null;
  return { ...chat, _id: chat._id.toString() };
}

async function create(userId, title = "New conversation") {
  const chat = await Chat.create({ userId, title, messages: [] });
  return { ...chat.toObject(), _id: chat._id.toString() };
}

async function addMessages(id, userId, msgs) {
  const chat = await Chat.findOne({ _id: id, userId });
  if (!chat) return null;
  msgs.forEach(m => chat.messages.push({ role: m.role, content: m.content }));
  if (chat.title === "New conversation") {
    const first = chat.messages.find(m => m.role === "user");
    if (first) chat.title = first.content.slice(0, 48) + (first.content.length > 48 ? "…" : "");
  }
  await chat.save();
  return { ...chat.toObject(), _id: chat._id.toString() };
}

async function rename(id, userId, title) {
  const chat = await Chat.findOneAndUpdate({ _id: id, userId }, { title: String(title).slice(0, 80) }, { new: true });
  if (!chat) return null;
  return { ...chat.toObject(), _id: chat._id.toString() };
}

async function remove(id, userId) {
  const result = await Chat.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}

module.exports = { list, get, create, addMessages, rename, remove };
