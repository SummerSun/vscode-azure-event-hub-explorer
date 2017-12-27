"use strict";

import * as vscode from 'vscode';
import { EventHubExplorer } from './eventHubExplorer';

export function activate(context: vscode.ExtensionContext) {
  let eventHubExplorer = new EventHubExplorer(context);

  context.subscriptions.push(vscode.commands.registerCommand('azure-event-hub-explorer.selectEventHub', () => { eventHubExplorer.selectEventHub(); }));

  context.subscriptions.push(vscode.commands.registerCommand('azure-event-hub-explorer.sendMessageToEventHub', () => { eventHubExplorer.sendMessageToEventHub(); }));

  context.subscriptions.push(vscode.commands.registerCommand('azure-event-hub-explorer.startMonitorEventHubMessage', () => { eventHubExplorer.startMonitorEventHubMessage(); }));

  context.subscriptions.push(vscode.commands.registerCommand('azure-event-hub-explorer.stopMonitorEventHubMessage', () => { eventHubExplorer.stopMonitorEventHubMessage(); }));

}

export function deactivate() { }