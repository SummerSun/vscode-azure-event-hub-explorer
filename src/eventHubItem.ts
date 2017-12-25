import { QuickPickItem } from 'vscode';
import { EHNamespace } from 'azure-arm-eventhub/lib/models';
import { EventEmitter } from 'events';

export class EventHubItem implements QuickPickItem {
    public readonly label: string;
    public readonly description: string;

    constructor(eventhub: EHNamespace) {
        this.label = eventhub.name;
    }
}