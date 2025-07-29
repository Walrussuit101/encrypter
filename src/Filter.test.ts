import assert from "node:assert";
import { describe, it } from "node:test";
import { Filer } from "./Filer";
import { join } from "path";
import { cwd } from "process";
import { readFileSync } from "fs";

describe('Filter', () => {
    it('throws if target path does not exist', () => {
        assert.throws(() => {
            new Filer('bad-test-path');
        });

        assert.throws(() => {
            new Filer('bad-test-path.txt');
        });
    });

    it('throws if target path is not a file', () => {
        assert.throws(() => {
            new Filer('node_modules');
        });
    });

    it('appends target path to cwd', () => {
        const filer = new Filer('package.json');

        assert.equal(filer.get_target_path(), join(cwd(), 'package.json'));
    });

    it('reads target contents', () => {
        const filer = new Filer('package.json');
        const actualContents = readFileSync(join(cwd(), 'package.json'));

        assert.equal(filer.get_target_contents().byteLength > 0, true);

        const comparison = filer.get_target_contents().compare(actualContents);

        assert.equal(comparison, 0);
    });
});