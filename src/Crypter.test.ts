import { describe, it } from "node:test";
import { Crypter } from "./Crypter";
import assert from "node:assert";

describe('Crypter', () => {
    const build_encrypted_buffer = (iv: Buffer, tag: Buffer, encrypted_data: Buffer): Buffer => {
        const output_buffer = Buffer.alloc(16 + iv.byteLength + tag.byteLength + encrypted_data.byteLength);

        output_buffer.write('.txt', 0); // add fake extension
        tag.copy(output_buffer, 16);
        iv.copy(output_buffer, 16 + tag.byteLength);
        encrypted_data.copy(output_buffer, 16 + tag.byteLength + iv.byteLength);

        return output_buffer;
    }

    describe('encrypt()', () => {
        it('returns an iv of 12 bytes', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(4, '1');

            const result = crypter.encrypt(to_encrypt, 'testpassword');

            assert.equal(result.iv.byteLength, 12);

            // assert its not an empty buffer
            const comparison = Buffer.alloc(12).compare(result.iv);

            assert.notEqual(comparison, 0);
        });

        it('returns an auth tag of 16 bytes', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(4, '1');

            const result = crypter.encrypt(to_encrypt, 'testpassword');

            assert.equal(result.tag.byteLength, 16);

            // assert its not an empty buffer
            const comparison = Buffer.alloc(16).compare(result.tag);

            assert.notEqual(comparison, 0);
        });

        it('returns encrypted data', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(4, '1');

            const result = crypter.encrypt(to_encrypt, 'testpassword');

            assert.equal(result.encrypted_data.byteLength > 0, true);

            // assert its not the raw data coming back
            const comparison = result.encrypted_data.compare(to_encrypt);

            assert.notEqual(comparison, 0);
        });

        it('generates a new iv each time', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(4, '1');

            const result1 = crypter.encrypt(to_encrypt, 'testpassword');
            const result2 = crypter.encrypt(to_encrypt, 'testpassword');

            const comparison = result1.iv.compare(result2.iv);

            assert.notEqual(comparison, 0);
        });
    });

    describe('decrypt()', () => {
        it('throws if decrypting with wrong password', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(11, 'hello world');

            const { iv, tag, encrypted_data } = crypter.encrypt(to_encrypt, 'testpassword');

            const encrypted_file_buffer = build_encrypted_buffer(iv, tag, encrypted_data);

            assert.throws(() => crypter.decrypt(encrypted_file_buffer, ''));
            assert.throws(() => crypter.decrypt(encrypted_file_buffer, 'testpassword1'));
            assert.throws(() => crypter.decrypt(encrypted_file_buffer, 'testpassword '));
            assert.throws(() => crypter.decrypt(encrypted_file_buffer, ' testpassword'));
            assert.throws(() => crypter.decrypt(encrypted_file_buffer, 'wrongpassword'));
        });

        it('throws if decrypting with wrong iv', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(11, 'hello world');

            const { tag, encrypted_data } = crypter.encrypt(to_encrypt, 'testpassword');

            assert.throws(() => {
                const wrong_iv = Buffer.alloc(5);
                const encrypted_file_buffer = build_encrypted_buffer(wrong_iv, tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_iv = Buffer.alloc(12, 'x');
                const encrypted_file_buffer = build_encrypted_buffer(wrong_iv, tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_iv = Buffer.alloc(12);
                const encrypted_file_buffer = build_encrypted_buffer(wrong_iv, tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_iv = Buffer.alloc(20);
                const encrypted_file_buffer = build_encrypted_buffer(wrong_iv, tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });
        });

        it('throws if decrypting with wrong auth tag', () => {
            const crypter = new Crypter('aes-256-gcm');
            const to_encrypt = Buffer.alloc(11, 'hello world');

            const { iv, encrypted_data } = crypter.encrypt(to_encrypt, 'testpassword');

            assert.throws(() => {
                const wrong_tag = Buffer.alloc(5);
                const encrypted_file_buffer = build_encrypted_buffer(iv, wrong_tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_tag = Buffer.alloc(16, 'x');
                const encrypted_file_buffer = build_encrypted_buffer(iv, wrong_tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_tag = Buffer.alloc(16);
                const encrypted_file_buffer = build_encrypted_buffer(iv, wrong_tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });

            assert.throws(() => {
                const wrong_tag = Buffer.alloc(20);
                const encrypted_file_buffer = build_encrypted_buffer(iv, wrong_tag, encrypted_data);
                crypter.decrypt(encrypted_file_buffer, 'testpassword');
            });
        });
    });

    it('returns original data after decrypting encrypted data', () => {
        const crypter = new Crypter('aes-256-gcm');
        const to_encrypt = Buffer.alloc(11, 'hello world');

        const { iv, tag, encrypted_data } = crypter.encrypt(to_encrypt, 'testpassword');

        const encrypted_file_buffer = build_encrypted_buffer(iv, tag, encrypted_data);

        const { decrypted_data } = crypter.decrypt(encrypted_file_buffer, 'testpassword');

        const comparison = decrypted_data.compare(to_encrypt);

        assert.equal(decrypted_data.byteLength, to_encrypt.byteLength);
        assert.equal(comparison, 0);
    });
});