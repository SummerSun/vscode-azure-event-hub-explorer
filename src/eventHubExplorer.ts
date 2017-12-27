"use strict";

import * as vscode from 'vscode';
import { Constants } from './constants';
import { Utility } from './utility';
import { AzureAccount } from './azure-account.api';
import { SubscriptionItem } from './subscriptionItem';
import { Client as EventHubClient, Sender as EventHubSender } from "azure-event-hubs";
import { SubscriptionClient, ResourceManagementClient } from 'azure-arm-resource';
import { QuickPickItem, commands } from 'vscode';

import EventHubManagementClient = require('azure-arm-eventhub');

export class EventHubExplorer {
    private _outputChannel: vscode.OutputChannel;
    private _eventHubClient;
    private readonly accountApi: AzureAccount;
    private eventHubManagementClient: EventHubManagementClient;

    constructor(context: vscode.ExtensionContext) {
        this._outputChannel = vscode.window.createOutputChannel('Azure Event Hub Explorer');
        this.accountApi = vscode.extensions.getExtension<AzureAccount>("ms-vscode.azure-account").exports;
    }

    /// <summary>
    /// Eventhub confusing conceptions explaination:
    /// namespaces is general concept of eventhub, eventhubs is general concept of eventhub entity
    /// select subscription -> select resourceGroup -> select eventHub -> select entity
    /// </summary>
    public async selectEventHub() {
        if (!(await this.accountApi.waitForLogin())) {
            return vscode.commands.executeCommand('azure-account.askForLogin');
        }
        const subscriptions = this.loadSubscriptions();
        const subscription = await vscode.window.showQuickPick(subscriptions, { placeHolder: "select a subscription", ignoreFocusOut: true });

        if (subscription) {
            const resourceGroups = await this.loadResourceGroups(subscription);
            const resourceGroup = await vscode.window.showQuickPick(resourceGroups, { placeHolder: "select a resoruce group", ignoreFocusOut: true });

            if (resourceGroup) {
                this.eventHubManagementClient = new EventHubManagementClient(subscription.credentials, subscription.id);
                var namespaces = await this.eventHubManagementClient.namespaces.list();
                const eventHub = await vscode.window.showQuickPick(namespaces.map(namespace => ({ label: namespace.name, description: '' })),
                    { placeHolder: "select an event hub", ignoreFocusOut: true });

                if (eventHub) {
                    const entities = await this.eventHubManagementClient.eventHubs.listByNamespace(resourceGroup.label, eventHub.label);
                    const entity = await vscode.window.showQuickPick(entities.map(entity => ({ label: entity.name, description: '' })),
                        { placeHolder: "select an event hub entity", ignoreFocusOut: true });

                    if (entity) {
                        const config = Utility.getConfiguration();
                        var keys = await this.eventHubManagementClient.namespaces.listKeys(resourceGroup.label, eventHub.label, Constants.AuthorizationRule);
                        await config.update(Constants.EventHubConnectionStringId, keys.primaryConnectionString, true);
                        await config.update(Constants.EventHubEntityName, entity.label, true);
                    }
                }
            }
        }
    }

    private async loadResourceGroups(subscription: SubscriptionItem) {
        const resources = new ResourceManagementClient(subscription.credentials, subscription.id);
        const resourceGroups = await resources.resourceGroups.list();
        resourceGroups.sort((a, b) => (a.name).localeCompare(b.name));
        return resourceGroups.map(resourceGroup => ({ label: resourceGroup.name, description: resourceGroup.location, }));
    }

    private async loadSubscriptions() {
        const subscriptions: SubscriptionItem[] = [];
        for (const session of this.accountApi.sessions) {
            const client = new SubscriptionClient(session.credentials);
            const list = await client.subscriptions.list();
            subscriptions.push(...list.map(subscription => new SubscriptionItem(subscription, session)));
        }
        subscriptions.sort((a, b) => a.label.localeCompare(b.label));
        return subscriptions;
    }

    public async sendMessageToEventHub() {
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        if (!eventHubConnectionString) {
            return;
        }
        let entity = await Utility.getConfigById(Constants.EventHubEntityName, Constants.EventHubEntityTitle);
        if (!entity) {
            return;
        }
        vscode.window.showInputBox({
            prompt: `enter message to send to event hub`,
        }).then((message: string) => {
            if (message !== undefined) {
                let client = EventHubClient.fromConnectionString(eventHubConnectionString, entity);
                try {
                    this._outputChannel.show();
                    this._outputChannel.appendLine('Azure Event Hub Explorer > Sending message to event hub...');
                    client.open().then(client.getPartitionIds.bind(client))
                        .then(() => client.createSender())
                        .then((sender: EventHubSender) => { return sender.send(message); })
                        .then(() => {
                            this._outputChannel.appendLine('Azure Event Hub Explorer > Success > Message send to event hub');
                            client.close();
                            client = null;
                        });
                } catch (e) {
                    this._outputChannel.appendLine('Azure Event Hub Explorer > Error > Failed to send message to event hub');
                    this._outputChannel.appendLine(e.toString());
                    client.close();
                    client = null;
                }
            }
        });
    }


    public async startMonitorEventHubMessage() {
        if (this._eventHubClient !== undefined && this._eventHubClient !== null) {
            this._outputChannel.appendLine('Azure Event Hub Explorer > Monitoring job is running');
            return;
        }
        let eventHubConnectionString = await Utility.getConfigById(Constants.EventHubConnectionStringId, Constants.EventHubConnectionStringTitle);
        if (!eventHubConnectionString) {
            this._outputChannel.appendLine('eventHubConnectionString not defined. Run selectEventHub to select your event hub first');
            return;
        }
        let eventHubPath = await Utility.getConfigById(Constants.EventHubEntityName, Constants.EventHubEntityTitle);
        if (!eventHubPath) {
            this._outputChannel.appendLine('eventHubPath not defined. Run selectEventHub to select your event hub first');
            return;
        }
        let consumerGroup = await Utility.getConfigById(Constants.EventHubConsumerGroupId, Constants.EventHubConsumerGroupTitle);

        if (!consumerGroup) {
            consumerGroup = "$Default";
        }
        try {
            this._outputChannel.show();
            this._outputChannel.appendLine('Azure Event Hub Explorer > Start monitoring event hub');
            this.startMonitor(eventHubConnectionString, eventHubPath, consumerGroup);
        } catch (e) {
            this._outputChannel.appendLine(`Azure Event Hub Explorer > Exception > ${e}`);
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
        let showVerboseMessage = config.get<boolean>(Constants.ShowVerboseMessageId);
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
