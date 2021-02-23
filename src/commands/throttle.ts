export default {
    activationEvents: 'onCommand:codeNote.throttle',
    name: 'codeNote.throttle',
    title: 'throttle(节流)',
    command(vscode: any) {
        return vscode.commands.registerCommand('codeNote.throttle', () => {
            vscode.env.clipboard
                .writeText(
                    `
    function throttle(func, wait, immediate) {
        let timeout;
        return function() {
            let context = this,
                args = arguments;
            let callNow = immediate && !timeout;
            if (timeout) {
                return;
            }
            timeout = setTimeout(function() {
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
