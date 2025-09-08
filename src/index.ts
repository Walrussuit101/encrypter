#!/usr/bin/env node
import { Crypter } from "./classes/Crypter";
import { Filer } from "./classes/Filer";
import { Program } from "./classes/Program";

const main = () => {
    const crypter = new Crypter('aes-256-gcm');
    const filer = new Filer();

    const program = new Program(crypter, filer);
    program.run();
}

main();