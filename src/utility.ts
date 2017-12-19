"use strict";

import * as vscode from 'vscode';

export class Utility {

    public static getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration("azure-event-hub-explorer");
    }

    public static getStringFromCharCode(source) {
        if (source instanceof Uint8Array) {
            try {
                source = String.fromCharCode.apply(null, source);
            } catch (e) {
            }
        }
        return source;
    }

    public static async getConfigById(id: string, name: string) {
        let config =  vscode.workspace.getConfiguration('azure-event-hub-explorer');
        let value = config.get<string>(id);
        if (!value || value.startsWith('<<')) {
            return await vscode.window.showInputBox({
                prompt: `${name}`,
                placeHolder: `Please config ${name}`
            }).then((v: string) => {
                if (v !== undefined) {
                    config.update(id, v, true);
                    return v;
                }
                return null;
            });
        }
        return value;
    }
}
