import {setConfig, exportConfigToJSON, getConfig, importConfigFromJSON, getJSONConfig} from "../../js_lib/config.js"

/**
 * Lädt die User Policies in die Tabelle
 */
export function loadUserPolicies(json_config) {
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
                <td class="user-policy-dropdown trust-preference-ca">
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
            <td class="user-policy-dropdown trust-preference-level">
                <select class="user-policy-dropdown trust-level-select">`;
        // Trust Level
        Object.entries(json_config['trust-levels']).forEach(entry => {
            const [level_name, _] = entry;
            let selected = (level_name == level) ? "selected" : "";
            domain_body += `
                <option ${selected}>${level_name}</option>`
            // set data-attribute
            if (selected) {
                
            }
        });
        // Delete Button
        domain_body += `
                </select></td>
                <td class="btn policy-del" style="text-align: center;">x</td>
            </tr>`;
    });

    domain_body += `
        <tr>
        <td colspan="2" style="border: none;"></td>
        <td colspan="1" class="btn policy-add" 
            style=" font-weight: bolder; color: whitesmoke; height:30px; 
                    background-color:#3D7F6E; font-size: larger;">
            +
        </td>
        </tr>`;


    return domain_body;
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