import {download} from "./helper.js"

/*
    Original Live Config Object is maintained by the background script.
    Pages can request the current state of the config via 'requestConfig' msg
*/
// TODO: Why a Map object and not a JSON object?
export let config = null;

export function getConfig() {
    console.log("getConfig: config is " + config);
    if (config === null) {
        initializeConfig();
        return config;
    } else {
        return config;
    }
}

export function setConfig(new_config) {
    config = new_config;
}

function defaultConfig() {
    let c = new Map();
    // TODO: remove duplicate local mapserver (only used for testing)
    // use 127.0.0.11 instead of localhost to distinguish the second test server from the first one (although it is the same instance)
    // also, using 127.0.0.11 ensures that the mapserver IPs do not clash with the local test webpage at 127.0.0.1
    c.set("mapservers", [
        {"identity": "local-mapserver", "domain": "http://localhost:8080", "querytype": "lfpki-http-get"},
        {"identity": "ETH-mapserver-top-100k", "domain": "http://129.132.55.210:8080", "querytype": "lfpki-http-get"}
    ]);
    // cache timeout in ms
    c.set("cache-timeout", 60*60*1000);
    // max amount of time in ms that a connection setup takes. Used to ensure that a cached policy that is valid at the onBeforeRequest event is still valid when the onHeadersReceived event fires.
    c.set("max-connection-setup-time", 1000);
    // timeout for fetching a proof from a mapserver in ms
    c.set("proof-fetch-timeout", 10000);
    // max number of attempted fetch operations before aborting
    c.set("proof-fetch-max-tries", 3);
    // quorum of trusted map servers necessary to accept their result
    c.set("mapserver-quorum", 1);
    // number of mapservers queried per validated domain (currently always choosing the first n entries in the mapserver list)
    c.set("mapserver-instances-queried", 1);
    // send the log entries as a custom event after fetching a webpage (used to debug/measure the extension)
    c.set("send-log-entries-via-event", true);
    // enable parsing X.509 certificates using web assembly (golang)
    c.set("wasm-certificate-parsing", true);
    c.set("ca-sets", (()=>{
        const caSet = new Map();
        // note that this is simply a subset of all US CAs for testing purposes
        caSet.set("US CA", ["CN=GTS CA 1C3,O=Google Trust Services LLC,C=US",
                            "CN=GTS Root R1,O=Google Trust Services LLC,C=US",
                            "CN=Amazon,OU=Server CA 1B,O=Amazon,C=US",
                            "CN=Amazon Root CA 1,O=Amazon,C=US",
                            "CN=DigiCert Global CA G2,O=DigiCert Inc,C=US",
                            "CN=DigiCert Global Root G2,OU=www.digicert.com,O=DigiCert Inc,C=US"]);
        // don't include the currently used root CA for testing purposes: "CN=DigiCert Global Root G2,OU=www.digicert.com,O=DigiCert Inc,C=US"
        caSet.set("Microsoft CA",
                  ["CN=Baltimore CyberTrust Root,OU=CyberTrust,O=Baltimore,C=IE",
                   "CN=DigiCert Global Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US"]);
        return caSet;
    })());
    // the default level of a root certificate is 0
    // CAs with higher levels take precedence over CAs with lower levels
    c.set("legacy-trust-preference", (()=>{
        const tp = new Map();
        tp.set("*", [
            {caSet: "All Trust Store CAs", level: 1}
        ]);
        return tp;
    })());
    // the default level of a root certificate is 0
    // CAs with higher levels take precedence over CAs with lower levels
    c.set("policy-trust-preference", (()=>{
        const tp = new Map();
        tp.set("*", [{pca: "pca", level: 1}]);
        return tp;
    })());
    c.set("root-pcas", (()=>{
        const rootPcas = new Map();
        rootPcas.set("pca", "local PCA for testing purposes");
        return rootPcas;
    })());
    c.set("root-cas", (()=>{
        // TODO (cyrill): change this configuration to take the complete subject name into accound (not only CN)
        const rootCas = new Map();
        rootCas.set("GTS CA 1C3", "description: ...");
        rootCas.set("DigiCert Global Root CA", "description: ...");
        rootCas.set("TrustAsia TLS RSA CA", "description: ...");
        rootCas.set("DigiCert SHA2 Secure Server CA", "description: ...");
        rootCas.set("DigiCert Secure Site CN CA G3", "description: ...");
        rootCas.set("GlobalSign Organization Validation CA - SHA256 - G2", "description: ...");
        rootCas.set("DigiCert TLS Hybrid ECC SHA384 2020 CA1", "description: ...");
        return rootCas;
    })());

    console.log("Type: " + typeof c);
    return c;
}

/**
 * Loads config from local storage (across browser sessions) OR 
 * initializes live config object with default config settings
 */
function initializeConfig() {
    
    let c = localStorage.getItem("config");
    if (c === null) {
        console.log("initializing using default config");
        config = defaultConfig();
    } else {
        console.log("initialize using stored config");
        importConfigFromJSON(c);
    }
    saveConfig();
}

export function saveConfig() {
    /*
        Makes live config object persistent across browser sessions using the 
        local storage of the browser
    */
    console.log("saving config:\n" + config);
    localStorage.setItem("config", exportConfigToJSON(config));
}

/**
 * Returns a JSON string of the passed config Map object
 */
export function exportConfigToJSON(configMap, indent=false) {
    let jsonConfig = new Map();
    console.log("ACHTUNG\n" + configMap);
    configMap.forEach((value, key) => {
        if (["ca-sets", "legacy-trust-preference", "policy-trust-preference", "root-pcas", "root-cas"].includes(key)) {
            jsonConfig.set(key, Object.fromEntries(value));
        } else {
            jsonConfig.set(key, value);
        }
        // could try to implement using the datatype: e.g., if (typeof value === "map")
    });
    if (indent) {
        return JSON.stringify(Object.fromEntries(jsonConfig), null, 4);
    } else {
        return JSON.stringify(Object.fromEntries(jsonConfig));
    }
}

/**
 * 
 * @returns Config Object as JSON object
 */
export function getJSONConfig() {
    return JSON.parse(exportConfigToJSON(config));
}

var oldConfig;
/**
 * Converts the JSON string to a Map object and replaces the live config object
 */
export function importConfigFromJSON(jsonConfig) {
    const c = new Map();
    const parsedMap = new Map(Object.entries(JSON.parse(jsonConfig)));
    // convert necessary fields to Map type
    parsedMap.forEach((value, key) => {
        if (["ca-sets", "legacy-trust-preference", "policy-trust-preference", "root-pcas", "root-cas"].includes(key)) {
            c.set(key, new Map(Object.entries(value)));
        } else {
            c.set(key, value);
        }
    });
    config = c;
}

export function downloadConfig() {
    download("config.json", exportConfigToJSON(config, true));
}

export function resetConfig() {
    console.log("CALLED: resetConfig()\n")
    config = defaultConfig();
    // importConfigFromJSON('{ "name": true }')
    // console.log(exportConfigToJSON(config, true));
    saveConfig();
}
