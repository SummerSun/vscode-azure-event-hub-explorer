import * as assert from "assert";
import * as vscode from "vscode";
import { Utility } from "../src/utility";

suite("Utility Tests ", () => {

    test("should be able to get config", () => {
        Utility.getConfigById('showVerboseMessage', 'Test').then((showVerboseMessage) => {
            assert.equal(showVerboseMessage, false);
        });
    });
});
