import { QuickPickItem, TreeItem } from 'vscode';

export class EntityItem extends TreeItem implements QuickPickItem {
    public readonly label: string;
    public readonly description: string;

    constructor(label) {
        super(label);
    }
}