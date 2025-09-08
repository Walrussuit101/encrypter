import { CipherGCMTypes, createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

interface EncryptResult {
    tag: Buffer;
    iv: Buffer;
    encrypted_data: Buffer;
}

interface DecryptResult {
    original_extension: string;
    decrypted_data: Buffer;
}

export class Crypter {
    private algorithm: CipherGCMTypes;

    constructor(algorithm: CipherGCMTypes) {
        this.algorithm = algorithm;
    }

    public encrypt(to_encrypt: Buffer, password: string): EncryptResult {
        const iv = randomBytes(12);
        const key = createHash('sha256').update(password).digest();

        const cipher = createCipheriv(this.algorithm, key, iv);
        let encrypted_data = cipher.update(to_encrypt);
        cipher.final();

        const tag = cipher.getAuthTag();

        return {
            tag,
            iv,
            encrypted_data
        }
    }

    public decrypt(to_decrypt: Buffer, password: string): DecryptResult {
        const extension = to_decrypt.subarray(0, 16);   // extension is 16 bytes
        const tag = to_decrypt.subarray(16, 32);        // tag is 16 bytes
        const iv = to_decrypt.subarray(32, 44);         // iv is 12 bytes
        const encrypted_data = to_decrypt.subarray(44); // rest is encrypted data
        const key = createHash('sha256').update(password).digest();

        const decipher = createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(tag);

        const decrypted_data = decipher.update(encrypted_data);
        decipher.final();

        let original_extension = ''
        for (let i = 0; i < extension.length; i++) {
            const char_code = extension[i];

            if (char_code > 0) {
                original_extension += String.fromCharCode(char_code);
            }
        }

        return {
            original_extension,
            decrypted_data
        }
    }
}