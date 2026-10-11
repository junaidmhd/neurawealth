const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const USERS_FILE = path.join(DATA_DIR, "users.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function findByEmail(email) {
  if (!email) return null;
  const users = readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  const users = readUsers();
  return users.find(u => u._id === id) || null;
}

async function createUser({ name, email, password }) {
  const users = readUsers();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

function toPublic(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = { readUsers, writeUsers, findByEmail, findById, createUser, verifyPassword, toPublic };
