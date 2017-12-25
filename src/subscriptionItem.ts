import { SubscriptionModels } from "azure-arm-resource";
import { QuickPickItem } from "vscode";
import { AzureSession } from "./azure-account.api";
import { ServiceClientCredentials } from 'ms-rest';

export class SubscriptionItem implements QuickPickItem {
    public readonly label: string;
    public readonly description: string;
    public readonly credentials: ServiceClientCredentials;
    public readonly id: string;

    constructor(subscription: SubscriptionModels.Subscription, public readonly session: AzureSession) {
        this.label = subscription.displayName;
        this.id = subscription.subscriptionId;
        this.credentials = session.credentials;
    }
}
