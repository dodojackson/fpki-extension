//import {exportConfigToJSON, getConfig, importConfigFromJSON, getJSONConfig} from "../../js_lib/config.js"

import {reloadSettings} from "./config-page.js"
import { toggleElement } from "./misc.js";

import { getParentDomain } from "../../js_lib/domain.js";
// TODO: Use getParentDomain for sorting the domains..

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
        
        let policy_body = loadPolicyBody(json_config, domain);
        domain_body += policy_body;

        domain_body += `</tbody>`

        table_body += domain_header + domain_body;
    });

    table_body += `
        <tbody>
            <tr>
            <td colspan="2" style="padding:0;">
                <input  type="text" placeholder="__domain__" 
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
    loadEventListeners(json_config);
}


/**
 * Builds a "row" representing the preference
 */
function make_pref_row(json_config, domain, caset, level) {
    // load preference row template
    const template = document.getElementById("trust-preference-row-template");
    const clone = document.importNode(template.content, true);

    // set data-attributes for WAY easier querying later
    const row_div = clone.querySelector('div.trust-preference-row');
    row_div.setAttribute('data-domain', domain);
    row_div.setAttribute('data-caset', caset);
    row_div.setAttribute('data-trustlevel', level);

    // ca set selection
    const ca_div = clone.querySelector('div.trust-preference-ca');
    const caset_select = document.createElement('select');
    caset_select.classList.add('trust-preference-caset');
    caset_select.setAttribute('data-domain', domain);
    caset_select.setAttribute('data-caset', caset);
    caset_select.setAttribute('data-trustlevel', level);
    const available_casets = [caset, ...getUnconfiguredCASets(json_config, domain)];
    available_casets.forEach(set => {
        const caset_option = document.createElement('option');
        caset_option.textContent = set;
        // preselect current ca set
        if (set == caset) {
            caset_option.defaultSelected = true;
        }
        caset_select.appendChild(caset_option);
    });
    ca_div.appendChild(caset_select);

    // trust level selection
    const level_div = clone.querySelector('div.trust-preference-level');
    const trustlevel_select = document.createElement('select');
    trustlevel_select.classList.add('trust-preference-level')
    trustlevel_select.setAttribute('data-domain', domain);
    trustlevel_select.setAttribute('data-caset', caset);
    trustlevel_select.setAttribute('data-trustlevel', level);
    Object.entries(json_config['trust-levels']).forEach(elem => {
        const [level_name, _] = elem;
        const level_option = document.createElement('option');
        level_option.textContent = level_name;
        // preselect current trust level
        if (level_name == level) {
            level_option.defaultSelected = true;
        }
        trustlevel_select.appendChild(level_option);
    });
    level_div.appendChild(trustlevel_select);

    return clone
}


/**
 * Loads the preferences for the given domain in a tbody element
 */
function loadDomainPreferences(json_config, domain) {
    let tbody = document.createElement('tbody');

    console.log(domain + " PREFERENCES");

    Object
        .entries(json_config['legacy-trust-preference'][domain])
        .forEach(preference => {
            const [caset, level] = preference;

            let pref_row = document.createElement('tr');
            pref_row.classList.add('trust-preference-row');
            let pref_data = document.createElement('td');
            pref_data.classList.add('trust-preference-row');
            pref_data.colSpan = 2;
            pref_data.appendChild(make_pref_row(json_config, domain, caset, level));
            pref_row.appendChild(pref_data);
            tbody.appendChild(pref_row);
        }); 
    
        let pref_row = document.createElement('tr');
        pref_row.classList.add('trust-preference-row');
        let pref_data = document.createElement('td');
        pref_data.classList.add('trust-preference-row');
        pref_data.colSpan = 2;
        pref_data.appendChild(make_pref_row(json_config, domain, "--select--", "--select--"));
        pref_row.appendChild(pref_data);
        tbody.appendChild(pref_row);

    return tbody;
}


/**
 * 
 */
function loadEventListeners(json_config) {
    /*
        Change trust level
    */
    const trustlevel_selects = document
        .querySelectorAll('select.trust-preference-level');
    
    trustlevel_selects.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute('listener', 'true');
            elem.addEventListener('change', (e) => {
                // update data-attr
                update_data_attr(
                    elem.getAttribute('data-domain'),
                    elem.getAttribute('data-caset'),
                    elem.getAttribute('data-trustlevel'),
                    null,
                    elem.value
                );
                // update json config
                json_config['legacy-trust-preference']
                    [elem.getAttribute('data-domain')]
                    [elem.getAttribute('data-caset')] = elem.value;
                
                /*console.log("Changing trust level of " + 
                    elem.getAttribute('data-caset') + " to " +
                    elem.getAttribute('data-trustlevel') + " for domain " +
                    elem.getAttribute('data-domain')
                );*/
            });
        }
    });
    /*
        Change ca set
    */
    const caset_selects = document
        .querySelectorAll('select.trust-preference-caset');
    
    caset_selects.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute('listener', 'true');
            elem.addEventListener('change', (e) => {
                // backup previous caset name
                const prev_caset = elem.getAttribute('data-caset');
                // update data-attr
                update_data_attr(
                    elem.getAttribute('data-domain'),
                    elem.getAttribute('data-caset'),
                    elem.getAttribute('data-trustlevel'),
                    elem.value,
                    null
                );
                // update json config
                delete json_config['legacy-trust-preference'][elem.getAttribute('data-domain')][prev_caset];
                json_config['legacy-trust-preference']
                    [elem.getAttribute('data-domain')]
                    [elem.getAttribute('data-caset')] = elem.getAttribute('data-level');
                
                /*console.log("Changing trust level of " + 
                    elem.getAttribute('data-caset') + " to " +
                    elem.getAttribute('data-trustlevel') + " for domain " +
                    elem.getAttribute('data-domain')
                );*/
            });
        }
    });
}


/**
 * Synchronize data-attr. they are set at multiple elements
 */
function update_data_attr(domain, caset, level, new_caset=null, new_level=null) {
    const elements = document
        .querySelectorAll(`[data-domain="${domain}"][data-caset="${caset}"][data-trustlevel="${level}"]`);

    elements.forEach(elem => {
        console.log("Changing element...");

        if (new_caset != null) {
            elem.setAttribute('data-caset', new_caset);
        }
        if (new_level != null) {
            elem.setAttribute('data-trustlevel', new_level);
        }
    });
}


/**
 * Überschreibt die Policies für den spezifizierten Domainnamen mit der
 * aktuellen config. (gibt den neuen tbody zurück)
 *
 * @param {*} domain_name Domainbezeichnung
 */
function loadPolicyBody(json_config, domain_name) {
    let rules = json_config['legacy-trust-preference'][domain_name];

    let tbody = loadDomainPreferences(json_config, domain_name);
    return tbody.innerHTML;
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

                let policy_header = e.target.parentElement.parentElement.previousSibling;
                let domain = policy_header.children[0].children[0].innerHTML.trim();
                let unconfigured_casets = getUnconfiguredCASets(json_config, domain);
    
                if (unconfigured_casets.length === 0) {
                    alert("All CA Sets are configured already");
                } else {
                    let first_caset = unconfigured_casets[0];
                    json_config['legacy-trust-preference'][domain][first_caset] = "Standard Trust";
        
                    let policy_body = policy_header.nextElementSibling;
                    policy_body.innerHTML = loadPolicyBody(json_config, domain);
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

                let policy_body = policy_header.nextElementSibling;
                policy_body.innerHTML = loadPolicyBody(json_config, domain);
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

                console.log("Changing trust level of " + caset + " to " + trust_level + " for domain " + domain);
                json_config['legacy-trust-preference'][domain][caset] = trust_level;

                let policy_body = e.target.closest('tbody');
                policy_body.innerHTML = loadPolicyBody(json_config, domain);
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

                console.log("Changing " + previousCASet + " to " + caset);
                delete json_config['legacy-trust-preference'][domain][previousCASet];
                json_config['legacy-trust-preference'][domain][caset] = trust_level;

                previousCASet = caset;

                let policy_body = e.target.closest('tbody');
                policy_body.innerHTML = loadPolicyBody(json_config, domain);
                setupUserPolicyEventListeners(json_config);
            });
        }
    });

}


/**
 * Returns an array of the CA Sets, that have no configured trust level yet, for
 * the given domain.
 */
function getUnconfiguredCASets(json_config, domain) {

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