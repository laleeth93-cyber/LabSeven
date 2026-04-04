// --- BLOCK lib/auth-utils.ts OPEN ---
import bcrypt from "bcryptjs";

/**
 * Compares a plain text password with a hashed password from the database.
 * Used during User Login and when verifying the "Current Password" in Settings.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Hashes a plain text password for secure database storage.
 * Used during New User Registration and when saving a "New Password" in Settings.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
// --- BLOCK lib/auth-utils.ts CLOSE ---