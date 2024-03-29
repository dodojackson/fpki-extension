import {printMap, download} from "./helper.js"

// requestId => LogEntry (mutable)
var ongoingConnectionLogs = new Map();

// finished connection metrics (append-only)
var finishedConnectionLogs = [];

export class LogEntry {
    constructor(createdTimestamp, domain, tabId, method, type, perfStartTimestamp) {
        this.createdTimestamp = createdTimestamp;
        this.domain = domain;
        this.tabId = tabId;
        this.method = method;
        this.type = type;
        this.fpkiRequestInitiateErrors = [];
        this.fpkiResponses = [];
        this.fpkiResponseMetrics = [];
        this.perfStartTimestamp = perfStartTimestamp;
    }

    certificateChainReceived(certificateChain) {
        this.certificateChain = certificateChain;
    }

    fpkiRequestInitiateError(mapserver, error) {
        this.fpkiRequestInitiateErrors.push([mapserver, error]);
    }

    fpkiResponse(mapserver, policies, certificates, metrics) {
        this.fpkiResponses.push([mapserver, {policies: Object.fromEntries(policies), certificates: Object.fromEntries(certificates)}]);
        this.fpkiResponseMetrics.push([mapserver, metrics]);
    }

    validationFinished(decision, onHeadersReceivedStart, onHeadersReceivedEnd) {
        this.decision = decision;
        this.connectionSetupBase = onHeadersReceivedStart - this.perfStartTimestamp;
        this.connectionSetupOverhead = onHeadersReceivedEnd - onHeadersReceivedStart;
    }

    validationSkipped(onCompleted) {
        this.decision = "validation skipped";
        this.connectionCompletion = onCompleted - this.perfStartTimestamp;
    }

    trackRequest(requestId) {
        ongoingConnectionLogs.set(requestId, this);
    }

    finalizeLogEntry(requestId) {
        if (ongoingConnectionLogs.has(requestId)) {
            finishedConnectionLogs.push(this);
            ongoingConnectionLogs.delete(requestId);
        }
    }
}

export function getLogEntryForRequest(requestId) {
    return ongoingConnectionLogs.has(requestId) ? ongoingConnectionLogs.get(requestId) : null;
}

export function printLogEntriesToConsole() {
    console.log("printing log:" + printMap(ongoingConnectionLogs));
    //console.log("finalized logs:" + JSON.stringify(finishedConnectionLogs, null, 2));
}

export function getSerializedLogEntries() {
    return JSON.stringify(finishedConnectionLogs);
}

export function downloadLog() {
    download("logs.json", JSON.stringify(finishedConnectionLogs, null, 2));
}
