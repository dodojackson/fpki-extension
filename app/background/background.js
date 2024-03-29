'use strict'

import { getDomainNameFromURL } from "../js_lib/domain.js"
import { FpkiRequest } from "../js_lib/fpki-request.js"
import { printMap, cLog, mapGetList, mapGetMap, mapGetSet } from "../js_lib/helper.js"
import { config, downloadConfig, importConfigFromJSON, getConfig, saveConfig, resetConfig, exportConfigToJSON, getJSONConfig, toOldConfig } from "../js_lib/config.js"
import { LogEntry, getLogEntryForRequest, downloadLog, printLogEntriesToConsole, getSerializedLogEntries } from "../js_lib/log.js"
import { FpkiError, errorTypes } from "../js_lib/errors.js"
import { policyValidateConnection, legacyValidateConnection } from "../js_lib/validation.js"
import { hasApplicablePolicy, getShortErrorMessages, hasFailedValidations } from "../js_lib/validation-types.js"
import "../js_lib/wasm_exec.js"
import { addCertificateChainToCacheIfNecessary, getCertificateEntryByHash } from "../js_lib/cache.js"


try {
    // await initializeConfig();
    // TODO: this is (or may be) called before the function finishes
    let test = await getConfig();
    console.log("Config-Type: " + typeof test);
    console.log("Config-Value:" + test);
    window.GOCACHE = test.get("wasm-certificate-parsing");
} catch (e) {
    console.log("initialize: " + e);
}

// flag whether to use Go cache

// instance to call Go Webassembly functions
const go = new Go();
WebAssembly.instantiateStreaming(fetch("../js_lib/wasm/parsePEMCertificates.wasm"), go.importObject).then((result) => {
    go.run(result.instance);
});

/** 
 * Receive one way messages from extension pages
 */
browser.runtime.onConnect.addListener( (port) => {

    port.onMessage.addListener(async (msg) => {
        switch (msg.type) {
        case "acceptCertificate":
            const {domain, certificateFingerprint, tabId, url} = msg;
            trustedCertificates.set(domain, mapGetSet(trustedCertificates, domain).add(certificateFingerprint));
            browser.tabs.update(tabId, {url: url});
            break;
        case 'postConfig':
            try {
                /**
                 * Save new format config and converted old format config
                 */
                console.log("POSTED CONFIG:");
                //setNewFormatConfig(msg.value);
                console.log(msg.value);

                //let converted_json_config = toOldConfig(new_format_config);

                // deep copy
                importConfigFromJSON(exportConfigToJSON(msg.value));

                //console.log("SAVED CONFIG:");
                //console.log(JSON.parse(exportConfigToJSON(config)));

                saveConfig();
                console.log("Updated config saved");
                break;
            } catch (e) {
                console.log(e);
            }
        default:
            switch (msg) {
            case 'initFinished':
                console.log("MSG RECV: initFinished");
                port.postMessage({msgType: "config", value: config});
                break;
            case 'printConfig':
                console.log("MSG RECV: printConfig");
                port.postMessage({msgType: "config", value: config});
                break;
            case 'downloadConfig':
                console.log("MSG RECV: downloadConfig");
                downloadConfig()
                break;
            case 'resetConfig':
                exit(1);
                console.log("MSG RECV: resetConfig");
                resetConfig()
                break;
            case 'openConfigWindow':
                browser.tabs.create({url: "../htmls/config-page/config-page.html"});
                break;
            case 'showValidationResult':
                port.postMessage({msgType: "validationResults", value: trustDecisions, config});
                break;
            case 'printLog':
                printLogEntriesToConsole();
                break;
            case 'downloadLog':
                downloadLog();
                break;
            case 'getLogEntries':
                port.postMessage({msgType: "logEntries", value: getSerializedLogEntries()});
                break;
            case 'requestConfig':
                port.postMessage("Hi there");
                break;
            }
        }
    });
})

/**
 * Receive messages with possibility of direct response
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    switch(request) {
        case 'requestConfig':
            console.log(`MSG RECV: ${request}`);
            return Promise.resolve({ "config": config });
        case 'requestJSONConfig':
            console.log(`MSG RECV: ${request}`);
            return Promise.resolve({ "config": getJSONConfig() });
        case 'resetConfig':
            console.log(`MSG RECV: ${request}`);
            resetConfig();
            return Promise.resolve({ "config": config });
        
        default:
            switch (request['type']) {
                case "uploadConfig":
                    console.log("setting new config value...");
                    // expect new format config
                    console.log(request['value']);
                    //setNewFormatConfig(JSON.parse(request['value']));
                    importConfigFromJSON(exportConfigToJSON(request['value']));
                    saveConfig();
                    return Promise.resolve({ "config": config });
                default:
                    console.log(`Received unknown message: ${request}`);
                    break;
            }
    }
});


// window.addEventListener('unhandledrejection', function(event) {
//   // the event object has two special properties:
//   alert(event.promise); // [object Promise] - the promise that generated the error
//   alert(event.reason); // Error: Whoops! - the unhandled error object
// });

const trustDecisions = new Map();

// contains certificates that are trusted even if legacy (and policy) validation
// fails
//
// data structure is a map [domain] => [x509 fingerprint]
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/CertificateInfo
const trustedCertificates = new Map();

/**
 * Redirect to an error page, depending on the type of validation error.
 */
function redirect(details, error, certificateChain=null) {
    cLog(details.requestId, "verification failed! -> redirecting. Reason: " + error + " [" + details.url + "]");
    // if any error is caught, redirect to the blocking page, and show the error
    // page
    let { tabId } = details;
    let htmlErrorFile;
    let reason = error.toString();
    let stacktrace = null;
    if (error.errorType === errorTypes.MAPSERVER_NETWORK_ERROR) {
        htmlErrorFile = "../htmls/map-server-error/block.html";
    } else if (error.errorType === errorTypes.LEGACY_MODE_VALIDATION_ERROR) {
        htmlErrorFile = "../htmls/validation-error-warning/block.html";
    } else if (error.errorType === errorTypes.POLICY_MODE_VALIDATION_ERROR) {
        htmlErrorFile = "../htmls/validation-error-blocking/block.html";
    } else {
        htmlErrorFile = "../htmls/other-error/block.html";
        stacktrace = error.stack;
    }

    let url = browser.runtime.getURL(htmlErrorFile) + "?reason=" + encodeURIComponent(reason) + "&domain=" + encodeURIComponent(getDomainNameFromURL(details.url));

    if (stacktrace !== null) {
        url += "&stacktrace="+encodeURIComponent(stacktrace);
    }

    // set the gobackurl such that if the user accepts the certificate of the
    // main page, he is redirected to this same main page.  
    // But if a resource such as an embedded image is blocked, the user should
    // be redirected to the document url of the main page (and not the resource)
    if (typeof details.documentUrl === "undefined") {
        url += "&url=" + encodeURIComponent(details.url);
    } else {
        url += "&url=" + encodeURIComponent(details.documentUrl);
    }

    if (certificateChain !== null) {
        url += "&fingerprint="+encodeURIComponent(certificateChain[0].fingerprintSha256);
    }

    browser.tabs.update(tabId, {url: url});
}

/**
 * Checks whether the given domain should be validated.
 * 
 * @returns `false` if domain is a mapserver, else `true`
 */
function shouldValidateDomain(domain) {
    // ignore mapserver addresses since otherwise there would be a circular
    // dependency which could not be resolved
    return config.get("mapservers").every(({ domain: d }) => getDomainNameFromURL(d) !== domain);
}


/**
 * TODO
 * 
 * @param {*} details 
 * @param {*} trustDecision 
 */
function addTrustDecision(details, trustDecision) {
    // find document url of this request
    const url = typeof details.documentUrl === "undefined" ? details.url : details.documentUrl;
    const urlMap = mapGetMap(trustDecisions, details.tabId);
    const tiList = mapGetList(urlMap, url);
    urlMap.set(url, tiList.concat(trustDecision));
    trustDecisions.set(details.tabId, urlMap);
}


/**
 * Queries mapservers for information about the domain.
 * 
 * @param {*} details as passed to eventListener by `onBeforeRequest`
 */
async function requestInfo(details) {
    const perfStart = performance.now();
    const startTimestamp = new Date();
    cLog(details.requestId, "requestInfo ["+details.url+"]");

    const domain = getDomainNameFromURL(details.url);
    // Do not validate mapservers
    if (!shouldValidateDomain(domain)) {
        // cLog(details.requestId, "ignoring (no requestInfo): " + domain);
        return;
    }
    const logEntry = new LogEntry(startTimestamp, domain, details.tabId, details.method, details.type, perfStart);
    
    for (const [index, mapserver] of config.get("mapservers").entries()) {
        if (index === config.get("mapserver-instances-queried")) {
            break;
        }
        // could randomize the queried mapservers and remember which were
        // queried by keeping a global map of the form  
        // [details.requestId: Array[index]]
        
        const fpkiRequest = new FpkiRequest(mapserver, domain, details.requestId);

        const policiesPromise = fpkiRequest.initiateFetchingPoliciesIfNecessary();

        // the following is necessary to prevent a browser warning:  
        // Uncaught (in promise) Error: ...
        policiesPromise.catch((error) => {
            logEntry.fpkiRequestInitiateError(mapserver.identity, error.message);
            // do not redirect here for now since we want to have a single point
            // of redirection to simplify logging
            cLog(details.requestId, "initiateFetchingPoliciesIfNecessary catch");
            redirect(details, error); // ??! s.o.
            throw error;
        });
    }

    logEntry.trackRequest(details.requestId);
}


/**
 *
 * @param {SecurityInfo} securityInfo Returned by
 * `browser.webRequest.getSecurityInfo`
 */
async function getTlsCertificateChain(securityInfo) {
    const chain = securityInfo.certificates.map(c => ({
        pem: window.btoa(String.fromCharCode(...c.rawDER)), 
        fingerprintSha256: c.fingerprint.sha256, 
        serial: c.serialNumber, 
        isBuiltInRoot: c.isBuiltInRoot})  // true if the certificate is one of 
        // the trust roots installed in the browser, false otherwise
    );

    await addCertificateChainToCacheIfNecessary(
        chain[0].pem, 
        chain.slice(1).map(c => c.pem)
    );

    chain.forEach((c, index) => {
        const entry = getCertificateEntryByHash(c.fingerprintSha256);
        chain[index].subject = entry.subjectStr;
        chain[index].issuer = entry.issuerStr;
    });

    return chain;
}


async function checkInfo(details) {
    //console.log("TEST TEST");
    const onHeadersReceived = performance.now();
    const logEntry = getLogEntryForRequest(details.requestId);
    cLog(details.requestId, "checkInfo ["+details.url+"]");
    const domain = getDomainNameFromURL(details.url);
    if (!shouldValidateDomain(domain)) {
        // cLog(details.requestId, "ignoring (no checkInfo): " + domain);
        return;
    }
    if (logEntry === null && details.fromCache) {
        // ensure that if checkInfo is called multiple times for a single
        // request, logEntry is ignored
        cLog(details.requestId, "skipping log entry for cached request: "+details);
    }
    if (logEntry === null && !details.fromCache) {
        // ensure that if checkInfo is called multiple times for a single
        // request, logEntry is ignored
        cLog(details.requestId, "no log entry for uncached request: "+details);
        throw new FpkiError(errorTypes.INTERNAL_ERROR);
    }

    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo
    const remoteInfo = await browser.webRequest.getSecurityInfo(details.requestId, {
        certificateChain: true,
        rawDER: true
    });

    // HTTP Connection
    if (remoteInfo.certificates === undefined) {
        cLog(details.requestId, "establishing non-secure http connection");
        // TODO: could also implement protection against http downgrade
        return;
    }

    const certificateChain = await getTlsCertificateChain(remoteInfo);

    if (logEntry !== null) {
        logEntry.certificateChainReceived(certificateChain);
    }

    let decision = "accept";
    try {
        const certificateFingerprint = certificateChain[0].fingerprintSha256;

        if (mapGetSet(trustedCertificates, domain).has(certificateFingerprint)) {
            // Skip validation, if the certificate is in `trustedCertificates`
            cLog(details.requestId, "skipping validation for domain (" + domain + ") because of the trusted certificate: " + certificateFingerprint);
        } else {

            // Save policies and certificates per mapserver
            const policiesMap = new Map();
            const certificatesMap = new Map();

            for (const [index, mapserver] of config.get("mapservers").entries()) {
                if (index === config.get("mapserver-instances-queried")) {
                    break;
                }
                // Query mapserver for domain information
                const fpkiRequest = new FpkiRequest(mapserver, domain, details.requestId);
                const {policies, certificates, metrics} = await fpkiRequest.fetchPolicies();
                policiesMap.set(mapserver, policies);
                certificatesMap.set(mapserver, certificates);
                if (logEntry !== null) {
                    logEntry.fpkiResponse(mapserver, policies, certificates, metrics);
                }
            }

            // remember if policy validation has been performed
            let policyChecksPerformed = false;

            // check each policy and throw an error if one of the verifications
            // fails
            policiesMap.forEach((policy, mapserver) => {
                cLog(details.requestId, "starting policy verification for ["+domain+", "+mapserver.identity+"] with policies: "+printMap(policy));

                const {trustDecision} = policyValidateConnection(certificateChain, config, domain, policy, mapserver);
                addTrustDecision(details, trustDecision);

                if (hasApplicablePolicy(trustDecision)) {
                    policyChecksPerformed = true;
                }
                if (hasFailedValidations(trustDecision)) {
                    throw new FpkiError(errorTypes.POLICY_MODE_VALIDATION_ERROR, getShortErrorMessages(trustDecision)[0]);
                }
            });

            // don't perform legacy validation if policy validation has already
            // taken place
            if (!policyChecksPerformed) {
                // check each policy and throw an error if one of the
                // verifications fails
                certificatesMap.forEach((certs, mapserv) => {  // for each mapserver..
                    cLog(details.requestId, "starting legacy verification for [" + domain + ", " + mapserv.identity + "] with policies: " + printMap(certs));
                    const {trustDecision} = legacyValidateConnection(certificateChain, config, domain, certs, mapserv);
                    addTrustDecision(details, trustDecision);
                    if (hasFailedValidations(trustDecision)) {
                        throw new FpkiError(errorTypes.LEGACY_MODE_VALIDATION_ERROR, getShortErrorMessages(trustDecision)[0]);
                    }
                    if (domain == "ttalvinex.de") {
                        console.log("TALVINEX HERE!!!");
                        throw new FpkiError(errorTypes.LEGACY_MODE_VALIDATION_ERROR, "Error number one");
                    }
                });
            }

            // TODO: legacy (i.e., certificate-based) validation

            // TODO: check connection for all policies and continue if at least
            // config.get("mapserver-quorum") responses exist

            // TODO: what happens if a response is invalid? we should definitely
            // log it, but we could ignore it if enough other valid responses
            // exist

            cLog(details.requestId, "verification succeeded! ["+details.url+"]");
        }
    } catch (error) {
        // TODO: in case that an exception was already thrown in requestInfo,
        // then the redirection occurs twice (but this is not an issue since
        // they both redirect to the same error url)
        decision = "reject: " + error
        redirect(details, error, certificateChain);
        throw error;
    } finally {
        if (logEntry !== null) {
            const onHeadersReceivedFinished = performance.now();
            logEntry.validationFinished(decision, onHeadersReceived, onHeadersReceivedFinished);
            logEntry.finalizeLogEntry(details.requestId);
        }
    }
}


// function extractTimings(timingEntry) {
//     return {
//         dnsLookup: timingEntry.domainLookupEnd-timingEntry.domainLookupStart,
//         transportSetup: timingEntry.connectEnd - timingEntry.connectStart,
//         secureTransportSetup: timingEntry.connectEnd - timingEntry.secureConnectionStart
//     };
// }


async function onCompleted(details) {
    const onCompleted = performance.now();
    const domain = getDomainNameFromURL(details.url);
    if (!shouldValidateDomain(domain)) {
        // cLog(details.requestId, "ignoring (no requestInfo): " + domain);
        return;
    }
    cLog(details.requestId, "onCompleted ["+details.url+"]");
    // cLog(details.requestId, printLogEntriesToConsole());
    const logEntry = getLogEntryForRequest(details.requestId);
    if (logEntry !== null) {
        cLog(details.requestId, "validation skipped (invoked onCompleted without onHeadersReceived)");
        logEntry.validationSkipped(onCompleted);
        logEntry.finalizeLogEntry(details.requestId);
    }
    if (config.get("send-log-entries-via-event") && details.type === "main_frame") {
        browser.tabs.executeScript(details.tabId, { file: "../content/sendLogEntries.js" })
    }
}


browser.webRequest.onBeforeRequest.addListener(
    requestInfo, 
    { urls: ["*://*/*"] },
    []
)

// add listener to header-received. 
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(
    checkInfo, 
    {  urls: ["*://*/*"] },
    ['blocking', 'responseHeaders']
)

browser.webRequest.onCompleted.addListener(
    onCompleted, 
    { urls: ["*://*/*"] }
)
