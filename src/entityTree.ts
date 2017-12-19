import * as vscode from 'vscode';

export class EntityTree implements  vscode.TreeDataProvider<vscode.TreeItem> {
    private onChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this.onChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
    }

    public refresh(element): void {
        this.onChangeTreeData.fire(element);
    }

    public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        return null;
    }
}