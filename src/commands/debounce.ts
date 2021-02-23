export default {
    activationEvents: 'onCommand:codeNote.debounce',
    name: 'codeNote.debounce',
    title: 'debounce(防抖)',
    command(vscode: any) {
        return vscode.commands.registerCommand('codeNote.debounce', () => {
            vscode.env.clipboard
                .writeText(
                    `
    function debounce(func, wait, immediate) {
        let timeout;
        return function () {
            let context = this,
                args = arguments;
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                timeout = null;
    
                if (!immediate) {
                    func.apply(context, args);
                }
            }, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }
            `
                )
                .then(() => {
                    vscode.window.showInformationMessage('已复制');
                });
        });
    },
};
