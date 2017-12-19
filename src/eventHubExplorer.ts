"use strict";

import * as vscode from "vscode";
import { Client as EventHubClient, Sender as EventHubSender } from "azure-event-hubs";
import { Client, Message } from "azure-iot-device";
import { Constants } from './constants';
import { Utility } from './utility';

export class EventHubExplorer {
    private _outputChannel: vscode.OutputChannel;
    private _eventHubClient;

    constructor(context: vscode.ExtensionContext) {
        this._outputChannel = vscode.window.createOutputChannel('Azure Event Hub Explorer');
    }
/* qisun: comment to wait for node sdk support
    public async createEntity() {

    }

    public async deleteEntity() {

    }

    public async getEntities() {

    }
*/
    public async sendMessageToEventHub(path?: string) {
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        
        let entityPath = path ? path : await Utility.getConfigById(Constants.EntityPathId, Constants.EntityPathTitle);
        if (!eventHubConnectionString || !entityPath) {
            return;
        }
        vscode.window.showInputBox({
            prompt: `enter message to send to event hub`,
        }).then((message: string) => {
            if (message !== undefined) {
                let client = EventHubClient.fromConnectionString(eventHubConnectionString, entityPath);
                try {
                    this._outputChannel.show();
                    this._outputChannel.appendLine('Azure Event Hub Explorer > Sending message to event hub...');
                    client.open()
                        .then(client.getPartitionIds.bind(client))
                        .then(() => client.createSender())
                        .then((sender: EventHubSender) => { return sender.send(message); })
                        .then(() => {
                            this._outputChannel.appendLine('Azure Event Hub Explorer > Success: Message send to event hub');
                            client.close();
                            client = null;
                        });
                } catch (e) {
                    this._outputChannel.appendLine('Azure Event Hub Explorer > Error: Failed to send message to event hub');
                    this._outputChannel.appendLine(e.toString());
                    client.close();
                    client = null;
                }
            }
        });
    }

    public async startMonitorEventHubMessage(path?: string) {
        if (this._eventHubClient !== undefined && this._eventHubClient !== null) {
            this._outputChannel.appendLine('Azure Event Hub Explorer > Monitoring job is running');
            return;
        }
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        let entityPath = path ? path : await Utility.getConfigById(Constants.EntityPathId, Constants.EntityPathTitle);
        let consumerGroup = await Utility.getConfigById(Constants.EventHubConsumerGroupId, Constants.EventHubConsumerGroupTitle);

        if (!eventHubConnectionString || !entityPath || !consumerGroup) {
            this._outputChannel.appendLine('eventHubConnectionString or entityPath or consumerGroup not defined');
            return;
        }
        try {
            this._outputChannel.show();
            this._outputChannel.appendLine('Azure Event Hub Explorer > Start monitoring event hub');
            this.startMonitor(eventHubConnectionString, entityPath, consumerGroup);
        } catch (e) {
            this._outputChannel.appendLine(`Azure Event Hub Explorer > Exception: ${e}`);
        }
    }

    private startMonitor(connectionString: string, path: string, consumerGroup: string): void {
        this._eventHubClient = EventHubClient.fromConnectionString(connectionString, path);
        this._eventHubClient.open().then(this._eventHubClient.getPartitionIds.bind(this._eventHubClient))
            .then((partitionIds: any) => {
                return partitionIds.map((partitionId) => {
                    return this._eventHubClient.createReceiver(consumerGroup, partitionId, { startAfterTime: Date.now() })
                        .then((receiver) => {
                            this._outputChannel.appendLine(`Azure Event Hub Explorer > Created partition receiver [${partitionId}] for consumerGroup [${consumerGroup}]`);
                            receiver.on("errorReceived", (err) => { this._outputChannel.appendLine(`Azure Event Hub Explorer > Error: ${err.message}`) });
                            receiver.on("message", (message) => { this.printMessage("Azure Event Hub Explorer > Message Received:", message); });
                        });
                });
            });
    }

    public stopMonitorEventHubMessage(): void {
        if (this._eventHubClient) {
            this._outputChannel.appendLine("Azure Event Hub Explorer > Stop monitoring event hub");
            this._eventHubClient.close();
        } else {
            this._outputChannel.appendLine("Azure Event Hub Explorer > No monitor job is running");
        }
        this._eventHubClient = null;
    }

    private async printMessage(prefix: string, message) {
        let config = Utility.getConfiguration();
        let showVerboseMessage = await config.get<boolean>(Constants.ShowVerboseMessageId);
        let result;
        if (showVerboseMessage) {
            result = {
                body: Utility.getStringFromCharCode(message.body),
                enqueuedTimeUtc: message.enqueuedTimeUtc,
                offset: message.offset,
                partitionKey: message.partitionKey,
                properties: message.properties,
                sequenceNumber: message.sequenceNumber,
                systemProperties: message.systemProperties,
            };
        } else {
            result = Utility.getStringFromCharCode(message.body);
        }
        this._outputChannel.appendLine(prefix);
        this._outputChannel.appendLine(JSON.stringify(result, null, 2));
    }
}
