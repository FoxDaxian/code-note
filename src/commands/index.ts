import * as fs from 'fs';
import * as path from 'path';

export default fs
    .readdirSync(path.resolve(__dirname))
    .filter((file: string) => !file.endsWith('.js.map'))
    .filter((file: string) => !file.startsWith('index.'))
    .map((file) => require(`./${file}`).default)
    .reduce(
        (result, command) => Object.assign(result, { [command.name]: command }),
        {}
    );
