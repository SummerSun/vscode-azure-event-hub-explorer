# vscode-azure-event-hub-explorer

This is a vscode extension to send message to or monitor messages in Azure Event Hub.

## Features

[x] Select Event Hub

[x] Send messages to Event Hub

[x] Monitor Event Hub messages

## Commands

| Command | Keyboard Shortcuts | Menu Contexts |
| --- | --- | --- |
| Select event hub | None | editor/context
| Send message to Event Hub | None | editor/context |
| Start monitoring Event Hub message | None | editor/context |
| Stop monitoring Event Hub message | None | editor/context (in output panel) |

## Configuration

You could directly run `EventHub: Select Event Hub` to set the event hub connectionstring and entity path you want to work with.

Otherwise, it will prompt for you to set them manually in settings when you try to send message to event hub or monitor event hub messages.

```json
{
    "azure-event-hub-explorer.eventHubConnectionString": "{Event Hub connection string}"
}
```

```json
{
    "azure-event-hub-explorer.eventHubPath": "{Event Hub path/name}"
}
```

Those two settings are optional.  eventHubConsumerGroup default is "$Default", and showVerboseMessage default to false.
```json
{
    "azure-event-hub-explorer.eventHubConsumerGroup": "$Default"
}
```

```json
{
    "azure-event-hub-explorer.showVerboseMessage": false
}
```

## Issues
Submit [issues](https://github.com/summersun/vscode-azure-event-hub-explorer/issues) if any problems or suggestions.

## Contribution
Fork the [repo](https://github.com/summersun/vscode-azure-event-hub-explorer) and submit pull requests.
