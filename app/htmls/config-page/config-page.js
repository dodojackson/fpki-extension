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
            port.postMessage("resetConfig");
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
        document.getElementById('saveChanges').addEventListener('click', () => {
            postConfig();
            console.log("Configuration changes have been saved");
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

async function printConfig() {
    /*
        Prints live config object to html as JSON string
    */
    var configCodeElement = document.getElementById("config-code");
    configCodeElement.innerHTML = "config = " + exportConfigToJSON(await getConfig(), true);
    reloadSettings();
}

async function requestConfig() {
    /*
        Request live config from background script
    */
    const response = await browser.runtime.sendMessage("requestConfig");
    setConfig(response.config);
}

async function postConfig() {
    /*
        Post configuration changes to live config in background script
    */
   port.postMessage({ "type": "postConfig", "value": await getConfig() });
}

async function reloadSettings() {
    /*
        Load configuration from live config object and set html elements accordingly

        TODO: Kann vielleicht auch einfach mit in 'printConfig'
    */
    let json_config = JSON.parse(exportConfigToJSON(await getConfig()))
    // let config = null;
    // Load mapservers into table
    var mapserver_rows = "";
    // console.log(JSON.stringify(config))
    json_config.mapservers.forEach(mapserver => {
        mapserver_rows +=  "<tr>" + 
                                "<td>" + mapserver.identity + "</td>" +
                                "<td>" + mapserver.domain + "</td>" +
                                "<td>" + mapserver.querytype + "</td>" +
                                "<td> <button class='btn_mapserver_delete'>Delete</button> </td>" +
                            "</tr>";
    });
    mapserver_rows +=   "<tr id='row_mapserver_add'>" + 
                            "<td><input type='text' placeholder='Identity' /></td>" +
                            "<td></td> <td></td>" +
                            "<td> <button class='btn_mapserver_add'>Add Mapserver</button> </td>" +
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
    
        
    
    
}