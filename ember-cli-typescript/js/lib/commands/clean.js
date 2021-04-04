"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ember_cli_entities_1 = require("../utilities/ember-cli-entities");
const precompile_1 = require("./precompile");
exports.default = ember_cli_entities_1.command({
    name: 'ts:clean',
    works: 'insideProject',
    description: 'Cleans up compiled JS and declaration files generated by `ember ts:precompile`.',
    availableOptions: [{ name: 'manifest-path', type: String, default: precompile_1.PRECOMPILE_MANIFEST }],
    run(options) {
        let manifestPath = options.manifestPath;
        if (!fs_1.default.existsSync(manifestPath)) {
            this.ui.writeWarnLine('No TS precompilation manifest found; you may need to clean up extraneous files yourself.');
            return;
        }
        let files = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
        for (let file of files) {
            if (fs_1.default.existsSync(file)) {
                if (file[file.length - 1] === '/') {
                    fs_1.default.rmdirSync(file);
                }
                else {
                    fs_1.default.unlinkSync(file);
                }
            }
        }
        fs_1.default.unlinkSync(manifestPath);
    },
});
