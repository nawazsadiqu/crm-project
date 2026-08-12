import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const encryptionKey =
    process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is not configured"
    );
  }

  const key = Buffer.from(
    encryptionKey,
    "hex"
  );

  if (key.length !== 32) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be a 32-byte hex key"
    );
  }

  return key;
};

export const encryptCredential = (
  value = ""
) => {
  if (!value) {
    return "";
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(
      String(value),
      "utf8"
    ),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptCredential = (
  encryptedValue = ""
) => {
  if (!encryptedValue) {
    return "";
  }

  const [
    ivHex,
    authTagHex,
    encryptedHex,
  ] = encryptedValue.split(":");

  if (
    !ivHex ||
    !authTagHex ||
    !encryptedHex
  ) {
    throw new Error(
      "Invalid encrypted credential format"
    );
  }

  const key = getEncryptionKey();

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, "hex")
    );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(
        encryptedHex,
        "hex"
      )
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};