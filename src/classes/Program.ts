import { existsSync, lstatSync, readdirSync } from "fs";
import { Crypter } from "./Crypter"
import { Filer } from "./Filer";
import { join } from "path";
import { cwd } from "process";

interface CommandResult {
    path: string;
    success: boolean;
    action: 'lock' | 'unlock'
}

export class Program {
    private crypter: Crypter;
    private filer: Filer;
    
    private args = {
        cmd: '',
        pass: '',
        target: ''
    }

    private commands = {
        lock: 'lock',
        unlock: 'unlock'
    }

    constructor(crypter: Crypter, filer: Filer) { 
        this.crypter = crypter;
        this.filer = filer;
        this.init_args();
    }

    private init_args() {
        const cmd = process.argv[2];
        const pass = process.argv[3];
        const target = process.argv[4];

        if (!cmd || !pass || !target) {
            throw new Error('Invalid arguments');
        }

        if(cmd !== this.commands.lock && cmd !== this.commands.unlock) {
            throw new Error('Invalid command');
        }

        this.args = {
            cmd,
            pass,
            target
        }
    }

    public run() {
        // determine if we're operating on a directory or a single file
        const target_path = join(cwd(), this.args.target);
        const is_directory = existsSync(target_path) && lstatSync(target_path).isDirectory();
        
        let results: CommandResult[] = [];

        if (is_directory) {
            // load each child's relative path to cwd
            const contents = readdirSync(target_path, { withFileTypes: true });
            const children_paths: string[] = [];

            for(let i = 0; i < contents.length; i++) {
                const child = contents[i];

                if (child.isFile()) {
                    children_paths.push(join(this.args.target, child.name));
                }
            }

            // execute command on directory
            if (this.args.cmd === this.commands.lock) {
                results = this.lock_directory(children_paths, this.args.pass);
            } else {
                results = this.unlock_directory(children_paths, this.args.pass);
            }
        } else {
            // execute command on file
            if (this.args.cmd === this.commands.lock) {
                results.push(this.lock_file(this.args.target, this.args.pass));
            } else {
                results.push(this.unlock_file(this.args.target, this.args.pass));
            }
        }

        this.log_results(results);
    }

    private log_results(results: CommandResult[]) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            let message = '';

            if (result.success) {
                message += 'SUCCESS: ';
            } else {
                message += 'FAILED: ';
            }

            if (result.action === 'lock') {
                message += `locked ${result.path}`
            } else {
                message += `unlocked ${result.path}`
            }

            console.log(message);
        }
    }

    private lock_file(target: string, pass: string): CommandResult { 
        try {
            this.filer.init_target(target, this.args.cmd);

            const { iv, tag, encrypted_data } = this.crypter.encrypt(this.filer.get_target_contents(), pass);

            this.filer.write_encrypted(iv, tag, encrypted_data);

            return {
                path: target,
                success: true,
                action: 'lock'
            }
        } catch(e) {
            return {
                path: target,
                success: false,
                action: 'lock'
            }
        }
    }

    private unlock_file(target: string, pass: string): CommandResult { 
        try {
            this.filer.init_target(target, this.args.cmd);

            const { decrypted_data, original_extension } = this.crypter.decrypt(this.filer.get_target_contents(), pass);

            this.filer.write_decrypted(decrypted_data, original_extension);

            return {
                path: target,
                success: true,
                action: 'unlock'
            }
        } catch(e) {
            return {
                path: target,
                success: false,
                action: 'unlock'
            }
        }
    }

    private lock_directory(targets: string[], pass: string): CommandResult[] { 
        const results: CommandResult[] = [];

        for(let i = 0; i < targets.length; i++) {
            const target = targets[i];

            results.push(this.lock_file(target, pass));
        }

        return results;
    }

    private unlock_directory(targets: string[], pass: string): CommandResult[] { 
        const results: CommandResult[] = [];

        for(let i = 0; i < targets.length; i++) {
            const target = targets[i];

            results.push(this.unlock_file(target, pass));
        }

        return results;
    }
}