import assert from "node:assert";
import { describe, it } from "node:test";
import { Filer } from "./Filer";
import { join } from "path";
import { cwd } from "process";
import { readFileSync } from "fs";

describe('Filer', () => {
    describe('init_target()', () => {
        it('throws if target path does not exist', () => {
            assert.throws(() => {
                new Filer().init_target('bad-test-path.txt', 'lock');
            });
        });

        it('throws if target path is not a file', () => {
            assert.throws(() => {
                new Filer().init_target('node_modules', 'lock');
            });
        });

        it('throws if command is unlock and target extension is not .encrypted', () => {
            assert.throws(() => {
                new Filer().init_target('package.json', 'unlock');
            });
        });

        it('appends target path to cwd', () => {
            const filer = new Filer();
            filer.init_target('package.json', 'lock');

            assert.equal(filer.get_target_path(), join(cwd(), 'package.json'));
        });

        it('reads target contents', () => {
            const filer = new Filer();
            filer.init_target('package.json', 'lock');

            const actual_contents = readFileSync(join(cwd(), 'package.json'));

            assert.equal(filer.get_target_contents().byteLength > 0, true);

            const comparison = filer.get_target_contents().compare(actual_contents);

            assert.equal(comparison, 0);
        });
    });
});