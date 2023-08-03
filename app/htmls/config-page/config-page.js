import {setConfig, exportConfigToJSON, getConfig, importConfigFromJSON} from "../../js_lib/config.js"

/*
    This script holds a working copy of the original live config object.
    Whenever the changes are saved, the original is replaced by this copy.
*/ 

var port = browser.runtime.connect({
    name: "config to background communication"
});

document.addEventListener('DOMContentLoaded', async() => { // TODO: muss nicht oder? (async)
    try {
        document.getElementById('printConfig').addEventListener('click', async () => {
            //port.postMessage("printConfig");
            await requestConfig();
            printConfig();
            // updateConfig();
        });
        document.getElementById('downloadConfig').addEventListener('click', function() {
            port.postMessage("downloadConfig");
        });
        document.getElementById('resetConfig').addEventListener('click', function() {
            resetConfig();
            console.log("posted message: resetConfig");
        });
        document.getElementById('uploadConfig').addEventListener('click', function() {
            let file = document.getElementById("file").files[0];
            let reader = new FileReader();
            
            reader.onload = function(e){
                port.postMessage({type: "uploadConfig", value: e.target.result});
            }
            reader.readAsText(file);
        });
        document.querySelectorAll('button.save-changes').forEach( (elem) => {
            elem.addEventListener('click', async () => {
                await loadCurrentInputToLocalConfig()
                await postConfig();
                console.log("Configuration changes have been saved");
            });
        });

        await requestConfig();
        await reloadSettings();
    } catch (e) {
        console.log("config button setup: " + e);
    }
});

port.onMessage.addListener( (msg) => {
    /*
        communication from background script to popup
    */
    const {msgType, value} = msg;
    // Receive live config object
    if (msgType === "config") {
        console.log("receiving config: " + value);
        setConfig(value);
        printConfig();
    }
});

/**
 * Prints live config object to html as JSON string
 */
async function printConfig() {
    var configCodeElement = document.getElementById("config-code");
    configCodeElement.innerHTML = "config = " + exportConfigToJSON(await getConfig(), true);
    reloadSettings();
}

/**
 * Ask background script to reset config to default.
 * Background script in turn will respond with the reset config.
 */
async function resetConfig() {
    const response = await browser.runtime.sendMessage("resetConfig");
    setConfig(response.config);
}

/**
 * Request live config from background script
 */
async function requestConfig() {
    const response = await browser.runtime.sendMessage("requestConfig");
    setConfig(response.config);
}

/**
 * Post configuration changes to live config in background script
 */
async function postConfig() {
   port.postMessage({ "type": "postConfig", "value": await getConfig() });
}

async function reloadSettings() {
    /*
        Load configuration from live config object and set html elements accordingly

        TODO: Kann vielleicht auch einfach mit in 'printConfig'
    */
    let json_config = JSON.parse(exportConfigToJSON(await getConfig()));

    // Load mapservers into table
    var mapserver_rows = "";
    json_config.mapservers.forEach(mapserver => {
        mapserver_rows +=  "<tr>" + 
                                "<td>" + mapserver.identity + "</td>" +
                                "<td>" + mapserver.domain + "</td>" +
                                "<td>" + mapserver.querytype + "</td>" +
                                "<td> <button class='btn_mapserver_delete'>Delete</button> </td>" +
                            "</tr>";
    });
    mapserver_rows +=   "<tr id='row_mapserver_add'>" + 
                            "<td><input id='input_mapserver_add_identity' type='text' placeholder='Identity' /></td>" +
                            "<td><input id='input_mapserver_add_domain' type='text' placeholder='Domain' /></td>" +
                            "<td><input type='text' placeholder='lfpki-http-get' disabled='disabled' /></td>" +
                            "<td> <button id='btn_mapserver_add'>Add Mapserver</button> </td>" +
                        "</tr>";
    document.getElementById('mapservers-table-body').innerHTML = mapserver_rows;
    // Add event listener to buttons to delete mapservers
    Array.from(document.getElementsByClassName('btn_mapserver_delete')).forEach(elem => {
        elem.addEventListener("click", function() {
            // TODO: assumes no duplicate mapserver identities
            let identity = this.parentElement.parentElement.cells[0].innerHTML;
            let filtered = json_config.mapservers.filter(item => item.identity !== identity);
            json_config.mapservers = filtered;
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
            return;
        });
    });
    // Add event listener to button for adding a mapserver
    document.getElementById('btn_mapserver_add').addEventListener("click", () => {
        json_config.mapservers.push({
            "identity": document.getElementById('input_mapserver_add_identity').value,
            "domain": document.getElementById('input_mapserver_add_domain').value,
            "querytype": "lfpki-http-get"
        })
        importConfigFromJSON(JSON.stringify(json_config));
        reloadSettings();
        return;
    });

    // Load current config values into input fields
    document.querySelector("input.cache-timeout").value = json_config['cache-timeout'];
    document.querySelector("input.max-connection-setup-time").value = json_config['max-connection-setup-time'];
    document.querySelector("input.proof-fetch-timeout").value = json_config['proof-fetch-timeout'];
    document.querySelector("input.proof-fetch-max-tries").value = json_config['proof-fetch-max-tries'];
    document.querySelector("input.mapserver-quorum").value = json_config['mapserver-quorum'];
    document.querySelector("input.mapserver-instances-queried").value = json_config['mapserver-instances-queried'];
    document.querySelector("input.send-log-entries-via-event").value = json_config['send-log-entries-via-event'];
    document.querySelector("input.wasm-certificate-parsing").value = json_config['wasm-certificate-parsing'];
}

async function loadCurrentInputToLocalConfig() {
    let json_config = JSON.parse(exportConfigToJSON(await getConfig()));

    json_config['cache-timeout'] = document.querySelector("input.cache-timeout").value;
    json_config['max-connection-setup-time'] = document.querySelector("input.max-connection-setup-time").value;
    json_config['proof-fetch-timeout'] = document.querySelector("input.proof-fetch-timeout").value;
    json_config['proof-fetch-max-tries'] = document.querySelector("input.proof-fetch-max-tries").value;
    json_config['mapserver-quorum'] = document.querySelector("input.mapserver-quorum").value;
    json_config['mapserver-instances-queried'] = document.querySelector("input.mapserver-instances-queried").value;
    json_config['send-log-entries-via-event'] = document.querySelector("input.send-log-entries-via-event").value;
    json_config['wasm-certificate-parsing'] = document.querySelector("input.wasm-certificate-parsing").value;

    importConfigFromJSON(JSON.stringify(json_config));
}