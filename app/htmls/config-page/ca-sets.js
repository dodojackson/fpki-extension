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

        //loadDomainContent(json_config, domain_name);
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