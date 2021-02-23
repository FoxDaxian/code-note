const commands = require('../out/commands/index').default;

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');

const internalCommands = Object.values(commands);

const tempEvents = [];
const tempCommands = [];

if (pkg.activationEvents.length === 1) {
    internalCommands.forEach((command) => {
        tempEvents.push(command.activationEvents);
        tempCommands.push({
            command: command.name,
            title: command.title,
        });
    });
    pkg.activationEvents = [...pkg.activationEvents, ...tempEvents];
    pkg.contributes.commands = [...pkg.contributes.commands, ...tempCommands];

    fs.writeFile(
        path.resolve(__dirname, '../package.json'),
        JSON.stringify(pkg, null, 4),
        (err) => {
            if (err) {
                console.error(err);
                return;
            }
        }
    );
}
