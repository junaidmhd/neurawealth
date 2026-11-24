const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

function normalizeUser(user) {
  if (!user) return null;

  const result =
    typeof user.toObject === "function" ? user.toObject() : user;

  return {
    _id: result._id.toString(),
    name: result.name,
    email: result.email,
    createdAt: result.createdAt
      ? new Date(result.createdAt).toISOString()
      : undefined,
    updatedAt: result.updatedAt
      ? new Date(result.updatedAt).toISOString()
      : undefined,
  };
}

async function findByEmail(email) {
  if (!email) return null;

  const user = await UserModel.findOne({
    email: email.toLowerCase().trim(),
  });

  return normalizeUser(user);
}

async function findById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const user = await UserModel.findById(id);

  return normalizeUser(user);
}

async function createUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  });

  return normalizeUser(user);
}

async function verifyPassword(user, password) {
  if (!user || !user.passwordHash) {
    return false;
  }

  return bcrypt.compare(password, user.passwordHash);
}

function toPublic(user) {
  if (!user) return null;

  const {
    passwordHash,
    ...publicUser
  } = user;

  return publicUser;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyPassword,
  toPublic,
};