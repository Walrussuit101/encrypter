import { existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, parse } from "path";
import { cwd } from "process";

export class Filer {
    private EXTENSION_CHUNK_LENGTH = 16;

    private target_path!: string;
    private target_extension!: string;
    private target_name!: string;
    private target_dir!: string;
    private target_contents!: Buffer;

    constructor() { }

    public init_target(target: string, cmd: string) {
        const target_path = join(cwd(), target);

        if (!existsSync(target_path) || !lstatSync(target_path).isFile()) {
            throw new Error(`Cannot utilize path "${target_path}"`);
        }

        const target_contents = readFileSync(target_path);
        const target_path_parsed = parse(target_path);

        if (target_path_parsed.ext.length > this.EXTENSION_CHUNK_LENGTH) {
            throw new Error(`Extension "${target_path_parsed.ext}" exceeds max length`);
        }

        if (
            (target_path_parsed.ext === '.encrypted' && cmd === 'lock') ||
            (target_path_parsed.ext !== '.encrypted' && cmd === 'unlock')
        ) {
            throw new Error('Trying to lock .encrypted or unlock non .encrypted file');
        }

        this.target_contents = target_contents;
        this.target_path = target_path;
        this.target_extension = target_path_parsed.ext;
        this.target_name = target_path_parsed.name;
        this.target_dir = target_path_parsed.dir;
    }

    public write_encrypted(iv: Buffer, tag: Buffer, encrypted_data: Buffer) {
        const output_buffer = Buffer.alloc(this.EXTENSION_CHUNK_LENGTH + iv.byteLength + tag.byteLength + encrypted_data.byteLength);

        output_buffer.write(this.target_extension, 0);
        tag.copy(output_buffer, this.EXTENSION_CHUNK_LENGTH);
        iv.copy(output_buffer, this.EXTENSION_CHUNK_LENGTH + tag.byteLength);
        encrypted_data.copy(output_buffer, this.EXTENSION_CHUNK_LENGTH + tag.byteLength + iv.byteLength);

        const output_path = join(this.target_dir, `${this.target_name}.encrypted`);

        writeFileSync(output_path, output_buffer);
        rmSync(this.target_path);
    }

    public write_decrypted(decrypted_data: Buffer, original_extension: string) {
        writeFileSync(join(this.target_dir, `${this.target_name}${original_extension}`), decrypted_data);
        rmSync(this.target_path);
    }

    public get_target_path(): string {
        return this.target_path;
    }

    public get_target_contents(): Buffer {
        return this.target_contents;
    }
}