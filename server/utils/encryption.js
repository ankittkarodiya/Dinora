const crypto = require("crypto");
const ALGORITHM = "aes-256-gcm";

const getKey = () => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY is not set in .env");
  return crypto.createHash("sha256").update(secret).digest(); // always 32 bytes
};

const encrypt = (plainText) => {
  if (!plainText) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return "";
  const [ivHex, authTagHex, dataHex] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !dataHex) return "";
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};



module.exports = { encrypt, decrypt };