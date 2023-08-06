import {setConfig, exportConfigToJSON, getConfig, importConfigFromJSON, getJSONConfig} from "../../js_lib/config.js"

/*
    This script holds a working copy of the original live config object.
    Whenever the changes are saved, the original is replaced by this copy.
*/ 

var port = browser.runtime.connect({
    name: "config to background communication"
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        document.getElementById('printConfig').addEventListener('click', async () => {
            await requestConfig();
            printConfig();
        });
        document.getElementById('downloadConfig').addEventListener('click', function() {
            port.postMessage("downloadConfig");
        });
        document.getElementById('resetConfig').addEventListener('click', async () => {
            await resetConfig();
            reloadSettings();
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
            elem.addEventListener('click', async (e) => {
                saveChanges(e)
                // await loadCurrentInputToLocalConfig()
                //await postConfig();
                console.log("Configuration changes have been saved");
            });
        });
        document.querySelectorAll('button.reset-changes').forEach(elem => {
            elem.addEventListener("click", async (e) => {
                await resetChanges(e);
            })
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
    await setConfig(response.config);
}

/**
 * Post configuration changes to live config in background script
 */
async function postConfig() {
   port.postMessage({ "type": "postConfig", "value": getConfig() });
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
                                "<td> <button class='delete btn_mapserver_delete'>Delete</button> </td>" +
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

    // Load legacy trust preferences
    let legacy_pref_rows = ""
    for (const[domain, ca_sets] of Object.entries(json_config['legacy-trust-preference'])) {
        let domain_pref_rows = ``
        ca_sets.forEach( (item, idx) => {
            let trust_levels = {
                0: "Untrusted",
                1: "Normal Trust",
                2: "High Trust"
            }
            if (idx == 0) {
                domain_pref_rows += `<tr>
                                        <td rowspan="${ca_sets.length + 1}">${domain}</td>
                                        <td>${item['caSet']}</td>
                                        <td>${trust_levels[item['level']]}</td>
                                        <td>
                                            <button class="delete delete_legacy_preference">Delete</button>
                                        </td>
                                    </tr>`
            } else {
                domain_pref_rows += `<tr>
                                        <td hidden>${domain}</td>
                                        <td>${item['caSet']}</td>
                                        <td>${trust_levels[item['level']]}</td>
                                        <td>
                                            <button class="delete delete_legacy_preference">Delete</button>
                                        </td>
                                    </tr>`
            }
        });
        let hide_domain = ""
        if (ca_sets.length != 0) {hide_domain = "hidden"}
        // Row to add new preference
        let ca_sets_options = ``;
        for (const [set_name, _] of Object.entries(json_config['ca-sets'])) {
            ca_sets_options += `<option value="${set_name}">${set_name}</option>`
        }
        domain_pref_rows += `<tr>
                                <td ${hide_domain}>${domain}</td>
                                <td>
                                    <select>
                                        ${ca_sets_options}
                                    </select>
                                    <!--<input type="text" placeholder="CA Set" />-->
                                </td>
                                <td>
                                    <select name="test">
                                        <option value="0">Untrusted</option>
                                        <option value="1" selected>Normal Trust</option>
                                        <option value="2">High Trust</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="add_legacy_preference">Add</button>
                                </td>
                            </tr>`
        legacy_pref_rows += `${domain_pref_rows}`
    }
    legacy_pref_rows += `<tr>
                            <td><input class="add_legacy_preference_domain" type="text" placeholder="Domain" /></td>
                            <td colspan="2"></td>
                            <td><button class="add_legacy_preference_domain">Add Domain</button></td>
                        </tr>`
    document.getElementById('legacy-trust-preference-table-body').innerHTML = legacy_pref_rows;

    // Add event listeners for legacy trust preference settings
    document.querySelector('button.add_legacy_preference_domain').addEventListener("click", (e) => {
        let domain = document.querySelector('input.add_legacy_preference_domain').value;
        json_config['legacy-trust-preference'][domain] = []
        importConfigFromJSON(JSON.stringify(json_config))
        reloadSettings();
    });
    document.querySelectorAll('button.delete_legacy_preference').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let domain = e.target.parentElement.parentElement.cells[0].innerHTML;
            let ca_set = e.target.parentElement.parentElement.cells[1].innerHTML;
            let filtered = json_config['legacy-trust-preference'][domain].filter(item => item['caSet'] !== ca_set);
            if (filtered.length == 0) {
                delete json_config['legacy-trust-preference'][domain];
            } else {
                json_config['legacy-trust-preference'][domain] = filtered;
            }
            importConfigFromJSON(JSON.stringify(json_config))
            reloadSettings();

            console.log(domain + ca_set)
        });
    });
    document.querySelectorAll('button.add_legacy_preference').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let domain = e.target.parentElement.parentElement.cells[0].innerHTML;
            let ca_set = e.target.parentElement.parentElement.cells[1].children[0].value;
            let trust_level = e.target.parentElement.parentElement.cells[2].children[0].value;
            json_config['legacy-trust-preference'][domain].push({
                "caSet": ca_set,
                "level": trust_level
            });
            importConfigFromJSON(JSON.stringify(json_config))
            reloadSettings();
        });
    });

    // Load policy trust preferences
    let policy_pref_rows = ""
    for (const[domain, ca_sets] of Object.entries(json_config['policy-trust-preference'])) {
        let domain_pref_rows = ``
        ca_sets.forEach( (item, idx) => {
            let trust_levels = {
                0: "Untrusted",
                1: "Normal Trust",
                2: "High Trust"
            }
            if (idx == 0) {
                domain_pref_rows += `<tr>
                                        <td rowspan="${ca_sets.length + 1}">${domain}</td>
                                        <td>${item['pca']}</td>
                                        <td>${trust_levels[item['level']]}</td>
                                        <td>
                                            <button class="delete delete_policy_preference">Delete</button>
                                        </td>
                                    </tr>`
            } else {
                domain_pref_rows += `<tr>
                                        <td hidden>${domain}</td>
                                        <td>${item['pca']}</td>
                                        <td>${trust_levels[item['level']]}</td>
                                        <td>
                                            <button class="delete delete_policy_preference">Delete</button>
                                        </td>
                                    </tr>`
            }
        });
        let hide_domain = ""
        if (ca_sets.length != 0) {hide_domain = "hidden"}
        // Row to add new preference
        let ca_sets_options = ``;
        for (const [pca_name, _] of Object.entries(json_config['root-pcas'])) {
            ca_sets_options += `<option value="${pca_name}">${pca_name}</option>`
        }
        domain_pref_rows += `<tr>
                                <td ${hide_domain}>${domain}</td>
                                <td>
                                    <select>
                                        ${ca_sets_options}
                                    </select>
                                </td>
                                <td>
                                    <select name="test">
                                        <option value="0">Untrusted</option>
                                        <option value="1" selected>Normal Trust</option>
                                        <option value="2">High Trust</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="add_policy_preference">Add</button>
                                </td>
                            </tr>`
        policy_pref_rows += `${domain_pref_rows}`
    }
    policy_pref_rows += `<tr>
                            <td><input class="add_policy_preference_domain" type="text" placeholder="Domain" /></td>
                            <td colspan="2"></td>
                            <td><button class="add_policy_preference_domain">Add Domain</button></td>
                        </tr>`
    document.getElementById('policy-trust-preference-table-body').innerHTML = policy_pref_rows;

    // Add event listeners for policy trust preference settings
    document.querySelector('button.add_policy_preference_domain').addEventListener("click", (e) => {
        let domain = document.querySelector('input.add_policy_preference_domain').value;
        json_config['policy-trust-preference'][domain] = []
        importConfigFromJSON(JSON.stringify(json_config))
        reloadSettings();
    });
    document.querySelectorAll('button.delete_policy_preference').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let domain = e.target.parentElement.parentElement.cells[0].innerHTML;
            let pca = e.target.parentElement.parentElement.cells[1].innerHTML;
            let filtered = json_config['policy-trust-preference'][domain].filter(item => item['pca'] !== pca);
            if (filtered.length == 0) {
                delete json_config['policy-trust-preference'][domain];
            } else {
                json_config['policy-trust-preference'][domain] = filtered;
            }
            importConfigFromJSON(JSON.stringify(json_config))
            reloadSettings();

            console.log(domain + pca)
        });
    });
    document.querySelectorAll('button.add_policy_preference').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let domain = e.target.parentElement.parentElement.cells[0].innerHTML;
            let pca = e.target.parentElement.parentElement.cells[1].children[0].value;
            let trust_level = e.target.parentElement.parentElement.cells[2].children[0].value;
            json_config['policy-trust-preference'][domain].push({
                "pca": pca,
                "level": trust_level
            });
            importConfigFromJSON(JSON.stringify(json_config))
            reloadSettings();
        });
    });

    // Load CA Sets
    let ca_sets_rows = "";
    for (const [key, value] of Object.entries(json_config['ca-sets'])) {
        value.forEach( (ca, idx) => {
            if (idx == 0) {
                ca_sets_rows += `<tr>
                                    <td rowspan=${value.length + 1}>${key}</td>
                                    <td>${ca}</td>
                                    <td>
                                        <button class="delete delete_ca_from_set">Delete</button>
                                    </td>
                                </tr>`
            } else {
                ca_sets_rows += `<tr>
                                    <td hidden>${key}</td>
                                    <td>${ca}</td>
                                    <td>
                                        <button class="delete delete_ca_from_set">Delete</button>
                                    </td>
                                </tr>`
            }
        });
        let hide_set_name = ""
        if (value.length != 0) {hide_set_name = "hidden"}
        ca_sets_rows += `
            <tr>
                <td ${hide_set_name}>${key}</td>
                <td>
                    <input type="text" placeholder="Distinguished Name" />
                </td>
                <td>
                    <button class="add_ca_to_set">Add</button>
                </td>
            </tr>`
    }
    ca_sets_rows += `<tr>
                        <td>
                            <input type="text" placeholder="Set Name" />
                        </td>
                        <td></td>
                        <td>
                            <button class="add_ca_set">Add CA Set</button>
                        </td>
                    </tr>`
    document.getElementById('ca-sets-table-body').innerHTML = ca_sets_rows;

    // Add CA Set event listeners
    document.querySelectorAll('button.delete_ca_from_set').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let set_name = e.target.parentElement.parentElement.cells[0].innerHTML;
            let ca_distinguished_name = e.target.parentElement.parentElement.cells[1].innerHTML;
            let filtered = json_config['ca-sets'][set_name].filter(elem => elem !== ca_distinguished_name);

            if (filtered.length == 0) {
                delete json_config['ca-sets'][set_name];
            } else {
                json_config['ca-sets'][set_name] = filtered;
            }
            
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
            console.log(ca_distinguished_name);
            console.log(filtered);
        });
    });
    document.querySelectorAll('button.add_ca_to_set').forEach(elem => {
        elem.addEventListener("click", (e) => {
            let set_name = e.target.parentElement.parentElement.cells[0].innerHTML;
            let ca_distinguished_name = e.target.parentElement.parentElement.cells[1].children[0].value;
            json_config['ca-sets'][set_name].push(ca_distinguished_name);
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
        });
    });
    document.querySelector('button.add_ca_set').addEventListener("click", (e) => {
        let set_name = e.target.parentElement.parentElement.cells[0].children[0].value;
        json_config['ca-sets'][set_name] = [];
        importConfigFromJSON(JSON.stringify(json_config));
        reloadSettings();
    });

    // Load other settings
    document.querySelector("input.cache-timeout").value = json_config['cache-timeout'];
    document.querySelector("input.max-connection-setup-time").value = json_config['max-connection-setup-time'];
    document.querySelector("input.proof-fetch-timeout").value = json_config['proof-fetch-timeout'];
    document.querySelector("input.proof-fetch-max-tries").value = json_config['proof-fetch-max-tries'];
    document.querySelector("input.mapserver-quorum").value = json_config['mapserver-quorum'];
    document.querySelector("input.mapserver-instances-queried").value = json_config['mapserver-instances-queried'];
    document.querySelector("input.send-log-entries-via-event").value = json_config['send-log-entries-via-event'];
    document.querySelector("input.wasm-certificate-parsing").value = json_config['wasm-certificate-parsing'];

    document.querySelector('input.cache-timeout').addEventListener("input", () => {
        json_config['cache-timeout'] = document.querySelector("input.cache-timeout").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.max-connection-setup-time').addEventListener("input", () => {
        json_config['max-connection-setup-time'] = document.querySelector("input.max-connection-setup-time").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.proof-fetch-timeout').addEventListener("input", () => {
        json_config['proof-fetch-timeout'] = document.querySelector("input.proof-fetch-timeout").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.proof-fetch-max-tries').addEventListener("input", () => {
        json_config['proof-fetch-max-tries'] = document.querySelector("input.proof-fetch-max-tries").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.mapserver-quorum').addEventListener("input", () => {
        json_config['mapserver-quorum'] = document.querySelector("input.mapserver-quorum").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.mapserver-instances-queried').addEventListener("input", () => {
        json_config['mapserver-instances-queried'] = document.querySelector("input.mapserver-instances-queried").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.send-log-entries-via-event').addEventListener("input", () => {
        json_config['send-log-entries-via-event'] = document.querySelector("input.send-log-entries-via-event").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
    document.querySelector('input.wasm-certificate-parsing').addEventListener("input", () => {
        json_config['wasm-certificate-parsing'] = document.querySelector("input.wasm-certificate-parsing").value;
        importConfigFromJSON(JSON.stringify(json_config));
    });
}

function loadCurrentInputToLocalConfig() {
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));

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

/**
 * Reset changes that have been made on the configuration page without saving.
 * Resets only changes made to the section of the pressed reset button.
 */
async function resetChanges(e) {
    const live_config = (await browser.runtime.sendMessage("requestJSONConfig")).config;
    let local_config = getJSONConfig();

    // Mapservers
    if (e.target.classList.contains('mapservers')) {
        local_config['mapservers'] = live_config['mapservers'];
        importConfigFromJSON(JSON.stringify(local_config));

        reloadSettings();
    }
    // Legacy Trust Preferences
    if (e.target.classList.contains('legacy-trust-preference')) {
        local_config['legacy-trust-preference'] = live_config['legacy-trust-preference'];
        importConfigFromJSON(JSON.stringify(local_config));

        reloadSettings();
    }
    // Policy Trust Preferences
    if (e.target.classList.contains('policy-trust-preference')) {
        local_config['policy-trust-preference'] = live_config['policy-trust-preference'];
        importConfigFromJSON(JSON.stringify(local_config));

        reloadSettings();
    }
    // CA Sets
    if (e.target.classList.contains('ca-sets')) {
        local_config['ca-sets'] = live_config['ca-sets'];
        importConfigFromJSON(JSON.stringify(local_config));

        reloadSettings();
    }
    // Other Settings
    if (e.target.classList.contains('other-settings')) {
        local_config['cache-timeout'] = live_config['cache-timeout'];
        local_config['max-connection-setup-time'] = live_config['max-connection-setup-time'];
        local_config['proof-fetch-timeout'] = live_config['proof-fetch-timeout'];
        local_config['proof-fetch-max-tries'] = live_config['proof-fetch-max-tries'];
        local_config['mapserver-quorum'] = live_config['mapserver-quorum'];
        local_config['mapserver-instances-queried'] = live_config['mapserver-instances-queried'];
        local_config['send-log-entries-via-event'] = live_config['send-log-entries-via-event'];
        local_config['wasm-certificate-parsing'] = live_config['wasm-certificate-parsing'];
        importConfigFromJSON(JSON.stringify(local_config));
        reloadSettings();
    }
}

/**
 * Save changes that have been made to the settings in the section of the 
 * pressed button.
 */
function saveChanges(e) {

    if (e.target.classList.contains('mapservers')) {
        postConfig();
    }

    if (e.target.classList.contains('legacy-trust-preference')) {
        postConfig();
    }

    if (e.target.classList.contains('policy-trust-preference')) {
        postConfig();
    }

    if (e.target.classList.contains('ca-sets')) {
        postConfig();
    }

    if (e.target.classList.contains('other-settings')) {
        // loadCurrentInputToLocalConfig();
        postConfig();
    }


}