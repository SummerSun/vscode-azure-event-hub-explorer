'use strict';

import * as vscode from 'vscode';
import { EventHubExplorer } from './eventHubExplorer';
import { EntityTree } from './entityTree';

export function activate(context: vscode.ExtensionContext) {
    let eventHubExplorer = new EventHubExplorer(context);
    let entityTree = new EntityTree(context);

    /* qisun: comment to wait for node sdk support
    let createEntity = vscode.commands.registerCommand('azure-event-hub-explorer.createEntity', () => {
        eventHubExplorer.createEntity();
    });

    let deleteEntity = vscode.commands.registerCommand('azure-event-hub-explorer.deleteEntity', () => {
        eventHubExplorer.deleteEntity();
    });

    let refresh = vscode.commands.registerCommand('azure-event-hub-explorer.refresh', (element) => {
        entityTree.refresh(element);
    });
    */

    let sendMessageToEventHub = vscode.commands.registerCommand('azure-event-hub-explorer.sendMessageToEventHub', () => {
        eventHubExplorer.sendMessageToEventHub();
    });

    let startMonitorEventHubMessage = vscode.commands.registerCommand('azure-event-hub-explorer.startMonitorEventHubMessage', () => {
        eventHubExplorer.startMonitorEventHubMessage();
    });

    let stopMonitorEventHubMessage = vscode.commands.registerCommand('azure-event-hub-explorer.stopMonitorEventHubMessage', () => {
        eventHubExplorer.stopMonitorEventHubMessage();
    })

    /* qisun: comment to wait for node sdk support
    context.subscriptions.push(createEntity);
    context.subscriptions.push(deleteEntity);
    context.subscriptions.push(refresh);
    */
    context.subscriptions.push(sendMessageToEventHub);
    context.subscriptions.push(startMonitorEventHubMessage);
    context.subscriptions.push(stopMonitorEventHubMessage);
}

export function deactivate() {
}