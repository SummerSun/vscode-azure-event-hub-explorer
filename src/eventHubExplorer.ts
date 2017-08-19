"use strict";

import * as vscode from "vscode";
import { Client as EventHubClient, Sender as EventHubSender } from "azure-event-hubs";
import { Client, Message } from "azure-iot-device";
import { Utility } from './utility';
import { Constants } from './constants';

export class EventHubExplorer {
    private _outputChannel: vscode.OutputChannel;
    private _eventHubClient;

    constructor(context: vscode.ExtensionContext) {
        this._outputChannel = vscode.window.createOutputChannel('Azure Event Hub Explorer');
    }

    public async sendMessageToEventHub() {
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        let eventHubPath = await Utility.getConfigById(Constants.EventHubPathId, Constants.EventHubPathTitle);
        if (!eventHubConnectionString || !eventHubPath) {
            return;
        }
        vscode.window.showInputBox({
            prompt: `enter message to send to event hub`,
        }).then((message: string) => {
            if (message !== undefined) {
                let client = EventHubClient.fromConnectionString(eventHubConnectionString, eventHubPath);
                try {
                    this._outputChannel.show();
                    this._outputChannel.appendLine('[Azure Event Hub Explorer] Sending message to event hub...');
                    client.open()
                        .then(client.getPartitionIds.bind(client))
                        .then(() => client.createSender())
                        .then((sender: EventHubSender) => { return sender.send(message); })
                        .then(this.sendToEventHubSuccess(client));
                } catch (e) {
                    this.sendToEventHubFail(client, e);
                }
            }
        });
    }

    public async startMonitorEventHubMessage() {
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        let eventHubPath = await Utility.getConfigById(Constants.EventHubPathId, Constants.EventHubPathTitle);
        let consumerGroup = await Utility.getConfigById(Constants.EventHubConsumerGroupId, Constants.EventHubConsumerGroupTitle);

        if (!eventHubConnectionString || !eventHubPath || !consumerGroup) {
            this._outputChannel.appendLine('eventHubConnectionString or eventHubPath or consumerGroup not defined');
            return;
        }
        try {
            this._outputChannel.show();
            this._outputChannel.appendLine('[Azure Event Hub Explorer] Start monitoring event hub');
            this.startMonitor(eventHubConnectionString, eventHubPath, consumerGroup);
        } catch (e) {
            this._outputChannel.appendLine(`[Azure Event Hub Explorer] Exception > ${e}`);
        }
    }

    private startMonitor(connectionString: string, path: string, consumerGroup: string): void {
        this._eventHubClient = EventHubClient.fromConnectionString(connectionString, path);
        this._eventHubClient.open().then(this._eventHubClient.getPartitionIds.bind(this._eventHubClient))
            .then((partitionIds: any) => {
                return partitionIds.map((partitionId) => {
                    return this._eventHubClient.createReceiver(consumerGroup, partitionId, { startAfterTime: Date.now() })
                        .then((receiver) => {
                            this._outputChannel.appendLine(`[Azure Event Hub Explorer] Created partition receiver [${partitionId}] for consumerGroup [${consumerGroup}]`);
                            receiver.on("errorReceived", (err) => {
                                this._outputChannel.appendLine(`[Azure Event Hub Explorer] Error: ${err.message}`)
                            });
                            receiver.on("message", (message) => {
                                let showVerboseMessage = Utility.getConfigById(Constants.ShowVerboseMessageId, Constants.ShowVerboseMessageTitle);
                                let result;
                                if (showVerboseMessage) {
                                    result = {
                                        body: message.body,
                                        enqueuedTimeUtc: message.enqueuedTimeUtc,
                                        offset: message.offset,
                                        partitionKey: message.partitionKey,
                                        properties: message.properties,
                                        sequenceNumber: message.sequenceNumber,
                                        systemProperties: message.systemProperties,
                                    };
                                    result.body = Utility.getStringFromCharCode(message.body);
                                } else {
                                    result = Utility.getStringFromCharCode(message.body);
                                }
                                this._outputChannel.appendLine("[Azure Event Hub Explorer] Message Received:");
                                this._outputChannel.appendLine(JSON.stringify(result, null, 2));
                            });
                        });
                });
            });
    }

    public stopMonitorEventHubMessage(): void {
        if (this._eventHubClient) {
            this._outputChannel.appendLine("[Azure Event Hub Explorer] Stop monitoring event hub");
            this._eventHubClient.close();
        } else {
            this._outputChannel.appendLine("[Azure Event Hub Explorer] No monitor job is running");
        }
        this._eventHubClient = null;
    }

    private sendToEventHubFail(client: EventHubClient, err): void {
        this._outputChannel.appendLine('[Azure Event Hub Explorer] Error > Failed to send message to event hub');
        this._outputChannel.appendLine(err.toString());
        client.close();
        client = null;
    }

    private sendToEventHubSuccess(client: EventHubClient) {
        return () => {
            this._outputChannel.appendLine('[Azure Event Hub Explorer] Success > Message send to event hub');
            client.close();
            client = null;
        };
    }
}
