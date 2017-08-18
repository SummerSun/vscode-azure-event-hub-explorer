'use strict';

import * as vscode from 'vscode';
import { EventHubExplorer } from './eventHubExplorer';

export function activate(context: vscode.ExtensionContext) {
    let eventHubExplorer = new EventHubExplorer(context);

    let sendMessageToEventHub = vscode.commands.registerCommand('azure-event-hub-explorer.sendMessageToEventHub', () => {
        eventHubExplorer.sendMessageToEventHub();
    });

    let startMonitorEventHubMessage = vscode.commands.registerCommand('azure-event-hub-explorer.startMonitorEventHubMessage', () => {
        eventHubExplorer.startMonitorEventHubMessage();
    });

    let stopMonitorEventHubMessage = vscode.commands.registerCommand('azure-event-hub-explorer.stopMonitorEventHubMessage', () => {
        eventHubExplorer.stopMonitorEventHubMessage();
    })


    context.subscriptions.push(sendMessageToEventHub);
    context.subscriptions.push(startMonitorEventHubMessage);
    context.subscriptions.push(stopMonitorEventHubMessage);
}

export function deactivate() {
}