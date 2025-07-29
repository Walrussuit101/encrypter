import { existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { cwd } from "process";

export class Filer {
    private target_path: string;
    private target_contents: Buffer;

    constructor(target: string) {
        const target_path = join(cwd(), target);

        if (!existsSync(target_path) || !lstatSync(target_path).isFile()) {
            throw new Error(`Cannot utilize path "${target_path}"`);
        }

        const target_contents = readFileSync(target_path);

        this.target_contents = target_contents;
        this.target_path = target_path;
    }

    public get_target_path(): string {
        return this.target_path;
    }

    public get_target_contents(): Buffer {
        return this.target_contents;
    }

    public write_encrypted(iv: Buffer, tag: Buffer, encrypted_data: Buffer) {
        const output_buffer = Buffer.alloc(iv.byteLength + tag.byteLength + encrypted_data.byteLength);

        output_buffer.fill(tag, 0);
        output_buffer.fill(iv, tag.byteLength);
        output_buffer.fill(encrypted_data, tag.byteLength + iv.byteLength);

        const target_basename = basename(this.target_path).split('.');
        const output_path = join(cwd(), `${target_basename.at(0)}.l.${target_basename.at(1)}`);

        writeFileSync(output_path, output_buffer);
        rmSync(this.target_path);
    }

    public write_decrypted(decrypted_data: Buffer) {
        const target_basename = basename(this.target_path).split('.l.');

        writeFileSync(join(cwd(), `${target_basename.at(0)}.${target_basename.at(1)}`), decrypted_data);
        rmSync(this.target_path);
    }
}