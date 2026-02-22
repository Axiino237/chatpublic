import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.MSG_ENCRYPTION_KEY || 'lovlink-secret-key-2026', 'salt', 32);
const iv = crypto.randomBytes(16);

export function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
    try {
        const [ivHex, encryptedText] = text.split(':');
        if (!ivHex || !encryptedText) return text; // Not encrypted
        const ivBuffer = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return text; // Fallback to raw text if decryption fails
    }
}
