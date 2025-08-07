import { Crypter } from "./Crypter";
import { Filer } from "./Filer";

const COMMANDS = {
    LOCK: 'lock',
    UNLOCK: 'unlock'
};

const main = () => {
    const cmd = process.argv[2];
    const pass = process.argv[3];
    const target = process.argv[4];

    const crypter = new Crypter('aes-256-gcm');
    const filer = new Filer(target);

    if (cmd === COMMANDS.LOCK) {      
        const { iv, tag, encrypted_data } = crypter.encrypt(filer.get_target_contents(), pass);

        filer.write_encrypted(iv, tag, encrypted_data);
    } else if (cmd === COMMANDS.UNLOCK) {
        const { decrypted_data, original_extension } = crypter.decrypt(filer.get_target_contents(), pass);

       filer.write_decrypted(decrypted_data, original_extension);
    } else {
        throw new Error(`Unexpected command "${cmd}"`);
    }
}

main();