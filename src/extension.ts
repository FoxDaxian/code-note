import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import commands from './commands';

interface CUSTOMCOMMAND {
    name: string;
    title: string;
    activationEvents: string;
    editable: Boolean;
    command: string;
}

function getTemp(command: CUSTOMCOMMAND) {
    return `module.exports = {
        activationEvents: 'onCommand:${command.name}',
        name: '${command.name}',
        title: '${command.title}',
        editable: ${command.editable},
        command: ${'`' + command.command + '`'},
    };`;
}

function checkDir(path: string): Promise<Boolean> {
    return new Promise((res) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                fs.mkdirSync(path);
                return;
            }
            if (!stats.isDirectory()) {
                fs.mkdirSync(path);
            }
            res(true);
        });
    });
}

function getCustomCommands(root: string): Promise<Boolean> {
    return new Promise((res) => {
        res(
            fs
                .readdirSync(path.resolve(root))
                .map((file) => require(`${root}${file}`))
                .reduce(
                    (result, command) =>
                        Object.assign(result, { [command.name]: command }),
                    {}
                )
        );
    });
}

export async function activate(context: vscode.ExtensionContext) {
    const homedir = require('os').homedir();

    const root = path.join(homedir, 'code-note/');
    let customCommands = await getCustomCommands(root);

    const htmlPath = path.join(context.extensionPath, 'view', 'index.html');

    // 新增代码片段
    let custom = vscode.commands.registerCommand(
        'codeNote.custom',
        async () => {
            customCommands = await getCustomCommands(root);
            const panel = vscode.window.createWebviewPanel(
                'code-note', // Identifies the type of the webview. Used internally
                'Code Note', // Title of the panel displayed to the user
                vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                {
                    localResourceRoots: [
                        vscode.Uri.file(
                            path.join(context.extensionPath, 'view')
                        ),
                    ],
                    enableScripts: true,
                } // Webview options. More on these later.
            );

            const resetCss = panel.webview.asWebviewUri(
                vscode.Uri.file(
                    path.join(context.extensionPath, 'view', 'reset.css')
                )
            );
            const indexCss = panel.webview.asWebviewUri(
                vscode.Uri.file(
                    path.join(context.extensionPath, 'view', 'index.css')
                )
            );
            let defaultCommands = { ...commands, ...customCommands };

            for (let name in defaultCommands) {
                defaultCommands[name].command = defaultCommands[
                    name
                ].command.toString();
            }

            const commandsScript = `<script>
                window.commands = ${JSON.stringify(defaultCommands)};
        </script>`;
            const resetLink = `<link href="${resetCss}" rel="stylesheet">`;
            const indexLink = `<link href="${indexCss}" rel="stylesheet">`;
            fs.readFile(htmlPath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                data = data.replace('{{resetCss}}', resetLink);
                data = data.replace('{{indexCss}}', indexLink);
                data = data.replace('{{commands}}', commandsScript);
                panel.webview.html = data;
            });

            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'add-new-command':
                            await checkDir(root);
                            fs.writeFile(
                                path.resolve(root, `${message.data.name}.js`),
                                getTemp(message.data),
                                function (err) {
                                    if (err) {
                                        vscode.window.showInformationMessage(
                                            err.message
                                        );
                                        return console.error(err);
                                    }
                                    const pkg = require(path.join(
                                        context.extensionPath,
                                        'package.json'
                                    ));
                                    pkg.activationEvents.push(
                                        `onCommand:${message.data.name}`
                                    );
                                    pkg.contributes.commands.push({
                                        command: message.data.name,
                                        title: message.data.title,
                                    });

                                    fs.writeFile(
                                        path.join(
                                            context.extensionPath,
                                            'package.json'
                                        ),
                                        JSON.stringify(pkg, null, 4),
                                        (err) => {
                                            if (err) {
                                                console.error(err);
                                                return;
                                            }

                                            vscode.window
                                                .showInformationMessage(
                                                    'save successed!',
                                                    'reload for work'
                                                )
                                                .then(() => {
                                                    vscode.commands.executeCommand(
                                                        'workbench.action.reloadWindow'
                                                    );
                                                });
                                        }
                                    );
                                }
                            );
                            break;
                        case 'error':
                            vscode.window.showErrorMessage(message.errorMsg);
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );
    // 当extension改变？
    // vscode.extensions.onDidChange(function (event) {
    //     vscode.window.showInformationMessage('extension发生了变化，请注意 ：：:');
    // });

    // 常用代码片段command注入
    Object.values(commands).forEach((command: any) => {
        context.subscriptions.push(command.command(vscode));
    });

    Object.values(customCommands).forEach((command: CUSTOMCOMMAND) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(command.name, () => {
                vscode.env.clipboard.writeText(command.command).then(() => {
                    vscode.window.showInformationMessage('已复制');
                });
            })
        );
    });

    context.subscriptions.push(custom);
}

export function deactivate() {}
