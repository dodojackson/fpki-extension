import {setConfig, exportConfigToJSON, getConfig, importConfigFromJSON, getJSONConfig} from "../../js_lib/config.js"

/*
    This script holds a working copy of the original live config object.
    Whenever the changes are saved, the original is replaced by this copy.
*/ 

var port = browser.runtime.connect({
    name: "config to background communication"
});

let set_builder; // global ca set builder class instance

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
        
        document.getElementById('uploadConfig').addEventListener('click', async () => {
            let file = document.getElementById("file").files[0];
            let reader = new FileReader();
            
            reader.onload = async function(e){
                port.postMessage({type: "uploadConfig", value: e.target.result});
                const response = await browser.runtime.sendMessage({type: "uploadConfig", value: e.target.result});
                setConfig(response.config);
                location.reload(true);
            }
            reader.readAsText(file);
        });
        
        document.querySelectorAll('button.save-changes').forEach( (elem) => {
            elem.addEventListener('click', async (e) => {
                saveChanges(e)
                console.log("Configuration changes have been saved");
            });
        });
        document.querySelectorAll('button.reset-changes').forEach(elem => {
            elem.addEventListener("click", async (e) => {
                await resetChanges(e);
            })
        });
        document.getElementById('advancedButton').addEventListener("click", (e) => {
            let adv_settings = document.getElementById('advanced-settings');
            if (adv_settings.hidden) {
                e.target.innerHTML = "Hide";
                adv_settings.hidden = false;
            } else {
                e.target.innerHTML = "Show";
                adv_settings.hidden = true;
            }
        });
        document
            .querySelectorAll("span.info-icon-old")
            .forEach(elem => {
                elem.addEventListener("click", (e) => {
                    let box = e.target.parentElement.children[2];
                    toggleElement(box);
                });
            });
            

        console.log("TEST 1");
        await requestConfig();
        console.log("TEST 2");
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


function toggleElement(box) {
    if (box.hidden === true) {
        box.hidden = false;
    } else {
        box.hidden = true;
    }
}


/**
 * Prints live config object to html as JSON string
 */
async function printConfig() {
    var configCodeElement = document.getElementById("config-code");
    configCodeElement.innerHTML = "config = " + exportConfigToJSON(getConfig(), true);
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
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));

    loadMapserverSettings();

    // Load legacy trust preferences
    loadUserPolicies(json_config);

    // Load CA Sets
    loadCASets(json_config);
    loadCASetBuilder(json_config);

    // Load trust levels settings
    loadTrustLevelSettings();

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


    // TODO: Event Listeners
    document
            .querySelectorAll("span.info-icon")
            .forEach(elem => {
                elem.addEventListener("click", (e) => {
                    let info_id = e.target.getAttribute('info-id');
                    let box = document.querySelector(`div.info-box[info-id="${info_id}"]`)
                    console.log(box)
                    box.style.left = (e.pageX - 5) + "px";
                    box.style.top = (e.pageY -5) + "px";
                    box.style.display = "block";
                    let screen_dim = document.querySelector('html').getBoundingClientRect();
                    box.style['max-width'] = (screen_dim.right - e.pageX - 50) + "px";
    
                    box.addEventListener("mouseleave", (e) => {
                        e.target.style.display = "none";
                    });
                });
            });
}


class CASetBuilder {
    constructor(json_config) {
        this.cas = json_config['ca-sets']['All Trust-Store CAs']['cas'];
        this.name = "Custom Set";
        this.description = "User-defined set of CAs";
        this.selected_cas = new Set();
    }

    filter(filter_str) {
        let filtered_cas = [];
        this.cas.forEach(ca => {
            if (ca.toLowerCase().includes(filter_str.toLowerCase())) {
                filtered_cas.push(ca);
            }
        });
        return filtered_cas;
    }

    /**
     * Remember if ca is checked or not (select on new filter)
     */
    toggle_select(ca) {
        if (this.selected_cas.has(ca)) {
            this.selected_cas.delete(ca);
        }
        else {
            this.selected_cas.add(ca);
        }
    }

    selected(ca) {
        if (this.selected_cas.has(ca)) {
            return true;
        } else {
            return false;
        }
    }

    add_current(json_config) {
        json_config['ca-sets'][this.name] = {
            description: this.description,
            cas: this.cas
        }

        importConfigFromJSON(JSON.stringify(json_config));
        reloadSettings();
    }

    test() {
        console.log("HERE COMES THE TEST");
        console.log(this.cas[0])
    }
}


class CASet {
    constructor(name, info) {
        this.name = name;
        this.description = info['description'];
        this.set = info['cas'];
    }

    /**
     * Print CASet HTML as needed
     */
    print() {
        let del_btn;
        if (this.name === "All Trust-Store CAs") {
            del_btn = `<td></td>`
        } else {
            del_btn = `<td class="btn">x</td>`
        }
        let set_html = `
        <tr class="${this.name} ca-set-html">
            <td class="btn" style="font-weight: 600; font-size: 16px;">${this.name}</td>
            <td>${this.description}</td>
            ${del_btn}
        </tr>
        <tr hidden >
            <td colspan="3">
                <div style="max-height:300px; overflow-y:scroll;">
                ${this.set.join("<br>")}
                </div>
            </td>
        </tr>`;

        return set_html;
    }

    test() {
        console.log(this.name + ": " + this.description);
    }
}

/**
 * Class holds CA-Sets and makes filtering sets/manipulating config easier
 */
class CASets {
    constructor(json_config) {
        this.sets = [];
        for (const [name, info] of Object.entries(json_config['ca-sets'])) {
            this.sets.push(new CASet(name, info));
        }
    }

    reloadSets(json_config) {
        this.sets = [];
        for (const [name, info] of Object.entries(json_config['ca-sets'])) {
            this.sets.push(new CASet(name, info));
        }
    }

    add(ca_set, json_config) {
        json_config['ca-sets'][ca_set.name] = {
            description: ca_set.description,
            cas: ca_set.set
        }
        this.reloadSets(json_config);
    }

    test() {
        this.sets.forEach(set => {
            set.test();
        });
    }
}


function loadCASetBuilder(json_config) {
    set_builder = new CASetBuilder(json_config);

    // CA Checkboxes
    let ca_div = document.querySelector('div#ca-sets-builder-cas');
    //let filter_str = e.target.previousElementSibling.value;

    let ca_checkboxes = ``;
    let all_cas = set_builder.cas;
    all_cas.forEach(ca => {
        ca_checkboxes += `
            <input type="checkbox" id="${ca}" class="ca-set-builder-checkbox"/>
            <label for="${ca}">${ca}</label><br>`;
    });
    ca_div.innerHTML = ca_checkboxes;

    // Event Listeners
    setupCASetBuilderEventListeners(json_config);
}

function setupCASetBuilderEventListeners(json_config) {

    // CA Filter
    /*
    let filter_btn = document.querySelector('button#filter-cas');
    filter_btn.addEventListener("click", (e) => {
        let ca_div = document.querySelector('div#ca-sets-builder-cas');
        let filter_str = e.target.previousElementSibling.value;

        let ca_checkboxes = ``;
        let filtered_cas = set_builder.filter(filter_str);
        filtered_cas.forEach(ca => {
            let checked = (set_builder.selected(ca)) ? "checked" : "";
            ca_checkboxes += `
                <input type="checkbox" id="${ca}" class="ca-set-builder-checkbox" ${checked}/>
                <label for="${ca}">${ca}</label><br>`;
        });
        // console.log(filtered_cas);
        ca_div.innerHTML = ca_checkboxes;
        setupCASetBuilderEventListeners();
    });*/

    // CA Filter (OnChange)
    let filter_input = document.querySelector("input.filter-cas");
    //console.log(filter_input);
    if (! filter_input.hasAttribute('listener')) {
        filter_input.addEventListener("input", (e) => {
            let ca_div = document.querySelector('div#ca-sets-builder-cas');
            let filter_str = e.target.value;
    
            let ca_checkboxes = ``;
            let filtered_cas = set_builder.filter(filter_str);
            filtered_cas.forEach(ca => {
                let checked = (set_builder.selected(ca)) ? "checked" : "";
                ca_checkboxes += `
                    <input type="checkbox" id="${ca}" class="ca-set-builder-checkbox" ${checked}/>
                    <label for="${ca}">${ca}</label><br>`;
            });
            // console.log(filtered_cas);
            ca_div.innerHTML = ca_checkboxes;
            e.target.setAttribute("listener", "true");
            setupCASetBuilderEventListeners();
        });
    }
    

    // CA Selection
    let checkboxes = document.querySelectorAll('.ca-set-builder-checkbox');
    checkboxes.forEach(box => {
        box.addEventListener("change", (e) => {
            set_builder.toggle_select(e.target.nextElementSibling.innerHTML);
        });
    });

    // Add CA Set
    let add_btn = document.querySelector('button#add-ca-set');
    if (!add_btn.hasAttribute("listener")) {
        add_btn.setAttribute("listener", "true");
        add_btn.addEventListener("click", (e) => {
            let json_config = JSON.parse(exportConfigToJSON(getConfig()));

            let set_name = document.querySelector('input#ca-sets-builder-name').value.trim();
            console.log(json_config['ca-sets']);
            let set_description = document.querySelector('input#ca-sets-builder-description').value.trim();
            let set_cas = [];
            set_builder.selected_cas.forEach(ca => {
                set_cas.push(ca);
            });
            // Add custom cas from textfield
            let custom_cas = document.querySelector('textarea#ca-sets-builder-custom-cas').value.split('\n');
            custom_cas = custom_cas.filter(ca => ca !== "");
            custom_cas.forEach(ca => {
                set_cas.push(ca.trim());
            });
            //console.log("About to add custom cas:");
            //console.log(custom_cas);
    
            json_config['ca-sets'][set_name] = {
                description: set_description,
                cas: set_cas
            }
            document.querySelector('input#ca-sets-builder-name').value = "";
            document.querySelector('input#ca-sets-builder-description').value = "";
            document.querySelector('#ca-sets-settings-section').scrollIntoView();
            //alert("Set hinzugefügt")
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
            
            
            //alert(set_name + " - " + set_description);
        });
    }
    
}


/**
 * Lädt die konfigurierten CA-Sets
 */
function loadCASets(json_config) {

    // Load selectable CAs from Trust Store (-ca-set)
    let trust_store_cas = json_config['ca-sets']['All Trust-Store CAs']['cas'];
    //console.log("HEYHEY")
    //console.log(trust_store_cas);
    //console.log(json_config['ca-sets'])
    let ca_selection = `<select name="ca_selection">`;
    trust_store_cas.forEach(ca => {
        ca_selection += `<option value="${ca}">${ca}</option>`;
    });
    ca_selection += `</select>`;

    //console.log(ca_selection);

    let ca_sets_rows = "";
    for (const [name, info] of Object.entries(json_config['ca-sets'])) {
        let set = new CASet(name, info);
        ca_sets_rows += set.print();
    }

    document.getElementById('ca-sets-table-body').innerHTML = ca_sets_rows;


    // Event Listeners
    let open_set_btns = document.querySelectorAll('tr.ca-set-html');
    open_set_btns.forEach(btn => {
        btn.children[0].addEventListener("click", (e) => {
            let cas_row = e.target.parentElement.nextElementSibling;
            toggleElement(cas_row);
            //console.log(e.target.parentElement.nextElementSibling);
            //alert("hi");
        });
    });

    let delete_set_buttons = document.querySelectorAll('tr.ca-set-html');
    delete_set_buttons.forEach(btn => {
        if (btn.children[0].innerHTML !== "All Trust-Store CAs") {
            btn.children[2].addEventListener("click", (e) => {
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));
                let set_name = btn.children[0].innerHTML;
                //console.log("HOHO: ");
                //console.log(json_config['ca-sets']['All Trust-Store CAs'])
                delete json_config['ca-sets'][set_name];
                //console.log("HOHO: ");
                //console.log(json_config['ca-sets']['All Trust-Store CAs'])
                importConfigFromJSON(JSON.stringify(json_config));
                reloadSettings();
            });
        } 
    });
}


/**
 * Lädt die User Policies in die Tabelle
 */
function loadUserPolicies(json_config) {
    console.log(json_config['legacy-trust-preference']);

    // Remove current table content
    let tbl_bodies = document.querySelectorAll('#user-policies-table tbody');
    tbl_bodies.forEach(elem => {
        elem.remove();
    })

    let table_body = ``;

    Object.entries(json_config['legacy-trust-preference']).forEach(entry => {
        const [domain, rules] = entry;
        console.log(domain + ":");

        let domain_header = `
            <tbody>
            <tr class="text-align: center;">
                <td colspan="2" class="policy-header btn policy-toggle">
                    ${domain}
                </td>
                <td class="btn policy-header delete-domain">
                    x
                </td>
            </tr>
            </tbody>`

        let domain_body;
        if (domain === "*") {
            domain_body = `<tbody>`
        }
        else {
            domain_body = `<tbody hidden>`
        }
        
        let policy_body = loadPolicyBody(domain);
        domain_body += policy_body;

        domain_body += `</tbody>`

        table_body += domain_header + domain_body;
    });

    table_body += `
        <tbody>
            <tr>
            <td colspan="2" style="padding:0;">
                <input  type="text" placeholder="___" 
                        style="background-color:rgb(231, 231, 231); height: 35px; text-align: center; font-weight: bolder; font-size: larger;">
            </td>
            <td id="user-policy-domain-add" class="btn" style="font-size: larger; font-weight: bolder; background-color:#3D7F6E; color: whitesmoke;">
                +
            </td>
            </tr>
        </tbody>`;

    // console.log(table_body);

    let table_head = document.querySelector("#user-policies-table").children[0]
    table_head.insertAdjacentHTML("afterend", table_body);

    setupUserPolicyEventListeners(json_config);
}


/**
 * Überschreibt die Policies für den spezifizierten Domainnamen mit der
 * aktuellen config. (gibt den neuen tbody zurück)
 *
 * @param {*} domain_name Domainbezeichnung
 */
function loadPolicyBody(domain_name) {
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));
    let rules = json_config['legacy-trust-preference'][domain_name];

    let domain_body = ``;
    Object.entries(rules).forEach(rule => {
        const [caset, level] = rule;

        console.log(caset + " has level " + level);
        // CA Set
        domain_body += `
            <tr>
                <td class="user-policy-dropdown">
                    <select class="user-policy-dropdown caset-select">`;

        let available_casets = [caset, ...getUnconfiguredCASets(domain_name)];
        /*
        Object.entries(json_config['ca-sets']).forEach(entry => {
            const [set_name, _] = entry;*/
        available_casets.forEach(set_name => {
            let selected = (set_name == caset) ? "selected" : "";
            domain_body += `
                <option ${selected}>${set_name}</option>`;
        });

        domain_body += `
            </select></td>
            <td class="user-policy-dropdown">
                <select class="user-policy-dropdown trust-level-select">`;
        // Trust Level
        Object.entries(json_config['trust-levels']).forEach(entry => {
            const [level_name, _] = entry;
            let selected = (level_name == level) ? "selected" : "";
            domain_body += `
                <option ${selected}>${level_name}</option>`
        });
        // Delete Button
        domain_body += `
                </select></td>
                <td class="btn policy-del" style="text-align: center;">x</td>
            </tr>`;
    });

    domain_body += `
        <tr>
        <td colspan="2" class="btn policy-add" 
            style=" font-weight: bolder; color: whitesmoke; height:30px; 
                    background-color:#3D7F6E; font-size: larger;">
            +
        </td>
        </tr>

        <tr>
        <td colspan="3" style="height: 20px; border: none;"></td>
        </tr>`;

    return domain_body;
    policy_body.innerHTML = domain_body;

    setupUserPolicyEventListeners(json_config);
}


/**
 * Event Listeners for buttons in user policy table
 */
function setupUserPolicyEventListeners(json_config) {
    // Toggle visibility of policies for specific domain
    let toggle_buttons = document.querySelectorAll('.policy-toggle');
    toggle_buttons.forEach(btn => {
        if (!btn.hasAttribute('listener')){
            btn.setAttribute("listener", "true");
            btn.addEventListener("click", (e) => {
                //alert("Toggle visibility");
                let div = e.target.parentElement.parentElement.nextSibling;
                toggleElement(div);
            });
        }
    });

    // Add policy to domain
    let add_policy_buttons = document.querySelectorAll('.policy-add');
    add_policy_buttons.forEach(btn => {
        if (btn.getAttribute('listener') !== "false") {
            btn.setAttribute('listener', 'false');
            btn.addEventListener("click", (e) => {
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));

                let policy_header = e.target.parentElement.parentElement.previousSibling;
                let domain = policy_header.children[0].children[0].innerHTML.trim();
                let unconfigured_casets = getUnconfiguredCASets(domain);
    
                if (unconfigured_casets.length === 0) {
                    alert("All CA Sets are configured already");
                } else {
                    let first_caset = unconfigured_casets[0];
                    json_config['legacy-trust-preference'][domain][first_caset] = "Standard Trust";
        
                    importConfigFromJSON(JSON.stringify(json_config));
                    let policy_body = policy_header.nextElementSibling;
                    policy_body.innerHTML = loadPolicyBody(domain);
                    setupUserPolicyEventListeners(json_config);
                }
            });
        }
        
    });

    // Remove policy from domain
    let del_policy_buttons = document.querySelectorAll('.policy-del');
    del_policy_buttons.forEach(btn => {
        if (!btn.hasAttribute('listener')) {
            btn.setAttribute("listener", "true");
            btn.addEventListener("click", (e) => {
                let caset = e.target.parentElement.children[0].children[0].value;
                let policy_header = e.target.parentElement.parentElement.previousSibling;
                let domain = policy_header.children[0].children[0].innerHTML.trim();
    
                delete json_config['legacy-trust-preference'][domain][caset];

                importConfigFromJSON(JSON.stringify(json_config));
                let policy_body = policy_header.nextElementSibling;
                policy_body.innerHTML = loadPolicyBody(domain);
                setupUserPolicyEventListeners(json_config);
            });
        }
        
    });

    // Add domain
    let domain_add_btn = document.getElementById("user-policy-domain-add");
    domain_add_btn.addEventListener("click", (e) => {
        let domain = e.target.parentElement.children[0].children[0].value;
        if (!json_config['legacy-trust-preference'].hasOwnProperty(domain)) {
            json_config['legacy-trust-preference'][domain] = {};
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
        }
    });

    // Remove domain
    let domain_del_bbn = document.querySelectorAll('.policy-header.delete-domain');
    domain_del_bbn.forEach(btn => {
        if (!btn.hasAttribute('listener')) {
            btn.setAttribute("listener", "true");
            btn.addEventListener("click", (e) => {
                let domain = e.target.previousElementSibling.innerHTML.trim();
                delete json_config['legacy-trust-preference'][domain];
                importConfigFromJSON(JSON.stringify(json_config));
                reloadSettings();
            });
        }
    });

    // Change Trust Level of Policy
    let trust_level_inputs = document.querySelectorAll('select.trust-level-select');
    trust_level_inputs.forEach(elem => {
        if (!elem.hasAttribute('listener')){
            elem.setAttribute("listener", "true");
            elem.addEventListener("change", (e) => {

                // Update local config on change
                let domain = e.target.closest('tbody').previousElementSibling.children[0].children[0].innerHTML.trim();
                let caset = e.target.closest('tr').children[0].children[0].value;
                let trust_level = e.target.value;
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));

                console.log("Changing trust level of " + caset + " to " + trust_level + " for domain " + domain);
                json_config['legacy-trust-preference'][domain][caset] = trust_level;
                importConfigFromJSON(JSON.stringify(json_config));

                let policy_body = e.target.closest('tbody');
                policy_body.innerHTML = loadPolicyBody(domain);
                setupUserPolicyEventListeners(json_config);
            });
        }
    });

    // Change CA Set of Policy
    let ca_set_inputs = document.querySelectorAll('select.caset-select');
    ca_set_inputs.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute("listener", "true");
            let previousCASet = elem.value;
            elem.addEventListener("change", (e) => {
                let domain = e.target.closest('tbody').previousElementSibling.children[0].children[0].innerHTML.trim();
                let trust_level = e.target.closest('tr').children[1].children[0].value;
                let caset = e.target.value;
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));

                console.log("Changing " + previousCASet + " to " + caset);
                delete json_config['legacy-trust-preference'][domain][previousCASet];
                json_config['legacy-trust-preference'][domain][caset] = trust_level;

                previousCASet = caset;

                importConfigFromJSON(JSON.stringify(json_config));
                let policy_body = e.target.closest('tbody');
                policy_body.innerHTML = loadPolicyBody(domain);
                setupUserPolicyEventListeners(json_config);
            });
        }
    });

}

/**
 * Returns an array of the CA Sets, that have no configured trust level yet, for
 * the given domain.
 */
function getUnconfiguredCASets(domain) {
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));

    let configured_casets = new Set();
    Object.entries(json_config['legacy-trust-preference'][domain]).forEach(rule => {
        const [caset, level] = rule;
        configured_casets.add(caset);
    });

    let all_casets = new Set();
    Object.entries(json_config['ca-sets']).forEach(set => {
        const [set_name, _] = set;
        all_casets.add(set_name);
    });

    let unconfigured_casets = [...all_casets].filter(x => !configured_casets.has(x));
    console.log("potential casets:");
    console.log(unconfigured_casets);

    return unconfigured_casets;
}


/**
 * Lädt die Trust Levels Tabelle
 */
function loadTrustLevelSettings() {
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));

    let table_rows = "";
    let trust_levels = Object.entries(json_config['trust-levels']);
    trust_levels.sort((a, b) => a[1] - b[1]);
    console.log(trust_levels);
    trust_levels.forEach(entry => {
        const [key, value] = entry;
        console.log(key + " is " + value);

        let rank_input = `<input type="number" min=1 max=100 value=${value} class="trust-level-rank-input"/>`
        let del_btn = `<td class="btn trust-level-delete" style="text-align: center;">x</td>`;
        let add_info = ``;

        if (key === "Untrusted" || key === "Standard Trust") {
            del_btn = `<td></td>`;
        }
        if (key === "Untrusted") {
            rank_input = ``;
            add_info = `
                <span class="info-icon" info-id="trust-level-untrusted">
                    &#9432;
                </span>`;
        }
        if (key === "Standard Trust") {
            add_info = `
            <span class="info-icon" info-id="trust-level-standard">
                &#9432;
            </span>`;
        }

        let table_row = `
            <tr>
                <td>${key}${add_info}</td>
                <td>${rank_input}</td>
                ${del_btn}
            </tr>`
        table_rows += table_row;
    });
    let table_body = document.getElementById('trust-levels-table-body');
    table_body.innerHTML = table_rows += `
        <tr>
            <td colspan="1">
                <input type="text" placeholder="___" class="trust-level-add"/>
            </td>
            <td colspan="2" class="btn trust-level-add" 
                style=" font-weight: bolder; color: whitesmoke; height:30px; 
                        background-color:#3D7F6E; font-size: larger;">
                +
            </td>
        </tr>`;

    loadTrustLevelSettingsEventListeners();
}


function loadTrustLevelSettingsEventListeners() {
    // OnChange rank inputs
    let rank_inputs = document.querySelectorAll('input.trust-level-rank-input');
    rank_inputs.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.addEventListener("change", (e) => {
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));
                let level_name = e.target.closest('tr').children[0].innerHTML.trim();
                let level_rank = e.target.value;
                if (level_rank != "") {
                    level_rank = parseInt(level_rank);
                    // No ranks above 100
                    if (level_rank > 100) {
                        level_rank = 100;
                        e.target.value = 100;
                    }
                    console.log("changing to " + level_rank);
                    json_config['trust-levels'][level_name] = level_rank;
                    importConfigFromJSON(JSON.stringify(json_config));
                } else {
                    console.log("rank nicht gültig")
                }
                //json_config['trust-levels'][level_name] = level_rank;
                // TODO: check that it is a number, sonst rot umranden?
                // TODO: oder already taken --> obwohl ist egal
            });
        }
    });

    // Delete Trust Level
    let del_btns = document.querySelectorAll('td.trust-level-delete');
    del_btns.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute("listener", "true");
            elem.addEventListener("click", (e) => {
                let json_config = JSON.parse(exportConfigToJSON(getConfig()));
                let level_name = e.target.closest('tr').children[0].innerHTML.trim();

                delete json_config['trust-levels'][level_name];
                importConfigFromJSON(JSON.stringify(json_config));
                loadTrustLevelSettings();
            });
        }
    });

    // Add trust level
    let add_btn = document.querySelector('td.trust-level-add');
    if (!add_btn.hasAttribute('listener')) {
        add_btn.setAttribute("listener", "true");
        add_btn.addEventListener("click", (e) => {
            let new_level_name = document.querySelector('input.trust-level-add').value.trim();
            let json_config = JSON.parse(exportConfigToJSON(getConfig()));

            json_config['trust-levels'][new_level_name] = 100;
            importConfigFromJSON(JSON.stringify(json_config));
            loadTrustLevelSettings();
            //alert(new_level_name);
        });
    }
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


function loadMapserverSettings() {
    let json_config = JSON.parse(exportConfigToJSON(getConfig()));

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

    if (e.target.classList.contains('trust-levels')) {
        local_config['trust-levels'] = live_config['trust-levels'];
        importConfigFromJSON(JSON.stringify(local_config));
        reloadSettings();
    }
}

/**
 * Save changes that have been made to the settings in the section of the 
 * pressed button.
 * 
 * TODO: only post changes to part of config, that was saved !!!
 */
function saveChanges(e) {

    if (e.target.classList.contains('mapservers')) {
        postConfig();
    }

    if (e.target.classList.contains('legacy-trust-preference')) {
        postConfig();
    }

    if (e.target.classList.contains('ca-sets')) {
        postConfig();
    }

    if (e.target.classList.contains('other-settings')) {
        // loadCurrentInputToLocalConfig();
        postConfig();
    }

    if (e.target.classList.contains('trust-levels')) {
        postConfig();
    }

    reloadSettings();

}