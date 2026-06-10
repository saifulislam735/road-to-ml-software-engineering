import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepo } from '../repositories/user.repo.js';
import { AppError, sanitizeUser } from '../utils/errors.js';

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export const authService = {
  async register(data) {
    const existingEmail = await userRepo.findByEmail(data.email);
    if (existingEmail) throw new AppError('Email already registered', 409);
    const existingUsername = await userRepo.findByUsername(data.username);
    if (existingUsername) throw new AppError('Username already taken', 409);

    const password = await bcrypt.hash(data.password, 12);
    const user = await userRepo.create({ ...data, password });
    return { token: sign(user), user: sanitizeUser(user) };
  },

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', 401);
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) throw new AppError('Invalid credentials', 401);
    if (user.isBanned) throw new AppError('Your account has been suspended.', 403);
    return { token: sign(user), user: sanitizeUser(user) };
  }
};
