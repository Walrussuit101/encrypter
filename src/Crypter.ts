import { CipherGCMTypes, createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

interface EncryptResult {
    tag: Buffer;
    iv: Buffer;
    encrypted_data: Buffer;
}

interface DecryptResult {
    decrypted_data: Buffer;
}

export class Crypter {
    private algorithm: CipherGCMTypes;

    constructor(algorithm: CipherGCMTypes) {
        this.algorithm = algorithm;
    }

    public encrypt(toEncrypt: Buffer, password: string): EncryptResult {
        const iv = randomBytes(12);
        const key = createHash('sha256').update(password).digest();

        const cipher = createCipheriv(this.algorithm, key, iv);
        let encrypted_data = cipher.update(toEncrypt);
        cipher.final();

        const tag = cipher.getAuthTag();

        return {
            tag,
            iv,
            encrypted_data
        }
    }

    public decrypt(toDecrypt: Buffer, password: string): DecryptResult {
        const tag = toDecrypt.subarray(0, 16);         // tag is 16 bytes
        const iv = toDecrypt.subarray(16, 28);         // iv is 12 bytes (16 + 12 for end location)
        const encrypted_data = toDecrypt.subarray(28); // rest is encrypted data
        const key = createHash('sha256').update(password).digest();

        const decipher = createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(tag);

        const decrypted_data = decipher.update(encrypted_data);
        decipher.final();

        return {
            decrypted_data
        }
    }
}