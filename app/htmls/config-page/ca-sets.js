import { showPopup, toggleElement } from "./misc.js";

/**
 * Loads all CA Sets into the correct DOM-container.  
 * Should only be used on full reload.
 */
export function initCASets(json_config) {
    const main_div = document.querySelector('div#ca-sets-casets');
    main_div.innerHTML = "";

    Object.entries(json_config['ca-sets']).forEach(elem => {
        const [caset_name, _] = elem;
        
        buildCASetDiv(caset_name);

        loadCASetContent(json_config, caset_name);
    });

    //sortDomains();

    //loadEventListeners(json_config);
}


/**
 * Create div for casets and add to ca-sets div
 */
function buildCASetDiv(caset_name) {
    const main_div = document.querySelector('div#ca-sets-casets');
    // load caset template
    const caset_div = document.importNode(
        document.getElementById("ca-sets-caset-template").content, 
        true
    );
    // init caset header
    caset_div
        .querySelector('select.ca-sets-caset-header')
        .appendChild((() => {
            const el = document.createElement('option');
            el.textContent = caset_name;
            return el;
        })());
    // init all childrens `data-caset`
    caset_div
        .querySelectorAll('[data-caset]')
        .forEach (elem => {
            elem.setAttribute('data-caset', caset_name);
        });
    // load domain div into DOM
    main_div.appendChild(caset_div);
}


/**
 * (Re)loads the casets content-div
 */
function loadCASetContent(json_config, caset_name) {
    // get the casets div
    const caset_div = document
        .querySelector(`div.ca-sets-caset-content[data-caset="${caset_name}"]`);
    const name_div = caset_div.querySelector(
        'div.ca-sets-caset-name'
    );
    const description_div = caset_div.querySelector(
        'div.ca-sets-caset-description'
    );
    // reset
    name_div.innerHTML = "";
    description_div.innerHTML = "";
    // TODO: will this be needed?
    try {
        // on first load there is no such div, ignore error
        caset_div.querySelector(
            'div.add-trust-preference-row'
        ).remove();
    } catch (e) {}

    //loadDomainPreferences(json_config, domain_name);
    // Load CA Set Name
    name_div.innerHTML = caset_name;
    //loadDomainInheritedPreferences(json_config, domain_name);
    // Load CA Set Descripton
    description_div.innerHTML = json_config['ca-sets'][caset_name]['description']
    // Load CAs
    loadCASetCAs(json_config, caset_name)

    loadEventListeners(json_config);
}


/**
 * Load CAs included in the CA Set
 * 
 * TODO: make editable
 */
function loadCASetCAs(json_config, caset_name) {
    const cas_div = document.querySelector(
        `div.ca-sets-caset-cas-content[data-caset="${caset_name}"]`
    )
    cas_div.innerHTML = ""
   
    json_config['ca-sets'][caset_name]['cas'].forEach(ca => {
        
    });
    // TEST
    let test = document.createElement("p");
    test.textContent = String(json_config['ca-sets'][caset_name]['cas'])

    cas_div.appendChild(test);
}


/**
 * 
 */
function loadEventListeners(json_config) {
    /*
        Expand CA Set
    */
    const caset_selects = document
        .querySelectorAll('select.ca-sets-caset-header');
    // remove default event expand
    caset_selects.forEach(elem => {
        elem.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });
    });
    // custom expand
    caset_selects.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute('listener', "true");
            elem.addEventListener("click", () => {
                toggleElement(document.querySelector(
                    `div.ca-sets-caset-content[data-caset="${elem.getAttribute('data-caset')}"`
                ));
            });
        }
    });
    
    /*
        Expand CA Set
    */
    const cas_selects = document
        .querySelectorAll('select.ca-sets-caset-cas-header');
    // remove default event expand
    cas_selects.forEach(elem => {
        elem.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });
    });
    // custom expand
    cas_selects.forEach(elem => {
        if (!elem.hasAttribute('listener')) {
            elem.setAttribute('listener', "true");
            elem.addEventListener("click", () => {
                toggleElement(document.querySelector(
                    `div.ca-sets-caset-cas-content[data-caset="${elem.getAttribute('data-caset')}"`
                ));
            });
        }
    });
}