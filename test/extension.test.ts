import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';

suite('Extension Tests', () => {
    test('should be present', () => {
        assert.ok(vscode.extensions.getExtension('Summer.azure-event-hub-explorer'));
    });

    test('should be able to activate extension', function (done) {
        this.timeout(60 * 1000);
        const extension = vscode.extensions.getExtension('Summer.azure-event-hub-explorer');
        if (!extension.isActive) {
            extension.activate().then((api)=>{
                done();
            }, () => {
                done('Failed to activate extension')
            });
        }
        else {
            done();
        }
    });

    test('should be able to register commands', () => {
        return vscode.commands.getCommands(true).then((commands) => {
            const targetCommands = ['azure-event-hub-explorer.sendMessageToEventHub', 'azure-event-hub-explorer.startMonitorEventHubMessage', 'azure-event-hub-explorer.stopMonitorEventHubMessage'].sort();
            const foundCommands = commands.filter((v) => {
                return v.startsWith('azure-event-hub-explorer');
            }).sort();

            assert.equal(JSON.stringify(foundCommands), JSON.stringify(targetCommands), 'Some of the commands are not registered properly or some new commands are not added to test');
        });
    });
});