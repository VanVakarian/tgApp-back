import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dbUsers from '../db/db-users.js';
import { JWT_SECRET } from '../env.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '31d' });
  return { accessToken, refreshToken };
};

export async function login(username, password) {
  const user = await dbUsers.getUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
    throw new Error('Invalid username and/or password');
  }
  return generateTokens(user);
}

export async function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = { id: decoded.id, username: decoded.username };
    return generateTokens(user);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
