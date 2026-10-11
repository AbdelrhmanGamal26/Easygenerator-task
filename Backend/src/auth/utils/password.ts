import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

// bcrypt only reads the first 72 bytes; a 44-char digest keeps long and multi-byte passwords intact.
const digest = (password: string) =>
  createHash('sha256').update(password, 'utf8').digest('base64');

export const hashPassword = (password: string) =>
  bcrypt.hash(digest(password), BCRYPT_ROUNDS);

export const verifyPassword = (password: string, stored: string) =>
  bcrypt.compare(digest(password), stored);
