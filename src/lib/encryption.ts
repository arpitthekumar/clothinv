import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getSecretKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "clothinv_secure_master_backup_key_2026";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a string using AES-256-GCM authenticated encryption.
 */
export function encryptToken(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getSecretKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (base64)
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("base64")}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return "";
  }
}

/**
 * Decrypts an AES-256-GCM encrypted token string.
 */
export function decryptToken(cipherText: string): string {
  if (!cipherText) return "";
  // If text is not encrypted format (doesn't contain colons), return as is if legacy plain
  if (!cipherText.includes(":")) return cipherText;

  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) return cipherText;

    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encryptedText = Buffer.from(parts[2], "base64");
    const key = getSecretKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
