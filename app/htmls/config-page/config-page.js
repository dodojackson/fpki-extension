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
        
        document.getElementById('uploadConfig').addEventListener('click', function () {
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
            .querySelectorAll("span.info-icon")
            .forEach(elem => {
                elem.addEventListener("click", (e) => {
                    let box = e.target.parentElement.children[2];
                    toggleElement(box);
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
    loadUserPolicies(json_config);

    let legacy_pref_rows = ""
    for (const[domain, ca_sets] of Object.entries(json_config['legacy-trust-preference'])) {
        let domain_pref_rows = ``
        ca_sets.forEach( (item, idx) => {
            let trust_levels = {
                0: "Untrusted",
                1: "Standard Trust",
                2: "High Trust",
                3: "Perfect Trust"
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
                                        <option value="1" selected>Standard Trust</option>
                                        <option value="2">High Trust</option>
                                        <option value="3">Perfect Trust</option>
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
                // delete json_config['legacy-trust-preference'][domain];
                json_config['legacy-trust-preference'][domain] = filtered;
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
                1: "Standard Trust",
                2: "High Trust",
                3: "Perfect Trust"
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
                                        <option value="1" selected>Standard Trust</option>
                                        <option value="2">High Trust</option>
                                        <option value="3">Perfect Trust</option>
                                    </select>
                                </td>
                                <td>
                                    <button class="add_policy_preference">Add</button>
                                </td>
                            </tr>
                            <tr class="spacing"><td colspan="4"></td></tr>`
        policy_pref_rows += `${domain_pref_rows}`
    }
    policy_pref_rows += `
                        <tr">
                            <td colspan="3"><input class="add_policy_preference_domain" type="text" placeholder="Domain" /></td>
                            
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
    let trust_store_cas = [
        "CN=Actalis Authentication Root CA,O=Actalis S.p.A./03358520967,L=Milan,C=IT",
        "CN=TunTrust Root CA,O=Agence Nationale de Certification Electronique,C=TN",
        "CN=Amazon Root CA 1,O=Amazon,C=US",
        "CN=Amazon Root CA 2,O=Amazon,C=US",
        "CN=Amazon Root CA 3,O=Amazon,C=US",
        "CN=Amazon Root CA 4,O=Amazon,C=US",
        "CN=Starfield Services Root Certificate Authority - G2,O=Starfield Technologies\, Inc.,L=Scottsdale,ST=Arizona,C=US",
        "CN=Certum CA,O=Unizeto Sp. z o.o.,C=PL",
        "CN=Certum EC-384 CA,OU=Certum Certification Authority,O=Asseco Data Systems S.A.,C=PL",
        "CN=Certum Trusted Network CA,OU=Certum Certification Authority,O=Unizeto Technologies S.A.,C=PL",
        "CN=Certum Trusted Network CA 2,OU=Certum Certification Authority,O=Unizeto Technologies S.A.,C=PL",
        "CN=Certum Trusted Root CA,OU=Certum Certification Authority,O=Asseco Data Systems S.A.,C=PL",
        "CN=Autoridad de Certificacion Firmaprofesional CIF A62634068,C=ES",
        "CN=Autoridad de Certificacion Firmaprofesional CIF A62634068,C=ES",
        "CN=ANF Secure Server Root CA,OU=ANF CA Raiz,O=ANF Autoridad de Certificacion,C=ES,2.5.4.5=G63287510",
        "CN=BJCA Global Root CA1,O=BEIJING CERTIFICATE AUTHORITY,C=CN",
        "CN=BJCA Global Root CA2,O=BEIJING CERTIFICATE AUTHORITY,C=CN",
        "CN=Buypass Class 2 Root CA,O=Buypass AS-983163327,C=NO",
        "CN=Buypass Class 3 Root CA,O=Buypass AS-983163327,C=NO",
        "CN=Certainly Root E1,O=Certainly,C=US",
        "CN=Certainly Root R1,O=Certainly,C=US",
        "CN=Certigna,O=Dhimyotis,C=FR",
        "CN=Certigna Root CA,OU=0002 48146308100036,O=Dhimyotis,C=FR",
        "OU=certSIGN ROOT CA,O=certSIGN,C=RO",
        "OU=certSIGN ROOT CA G2,O=CERTSIGN SA,C=RO",
        "CN=CFCA EV ROOT,O=China Financial Certification Authority,C=CN",
        "OU=ePKI Root Certification Authority,O=Chunghwa Telecom Co.\, Ltd.,C=TW",
        "CN=HiPKI Root CA - G1,O=Chunghwa Telecom Co.\, Ltd.,C=TW",
        "CN=SecureSign RootCA11,O=Japan Certification Services\, Inc.,C=JP",
        "CN=D-TRUST BR Root CA 1 2020,O=D-Trust GmbH,C=DE",
        "CN=D-TRUST EV Root CA 1 2020,O=D-Trust GmbH,C=DE",
        "CN=D-TRUST Root CA 3 2013,O=D-Trust GmbH,C=DE",
        "CN=D-TRUST Root Class 3 CA 2 2009,O=D-Trust GmbH,C=DE",
        "CN=D-TRUST Root Class 3 CA 2 EV 2009,O=D-Trust GmbH,C=DE",
        "CN=T-TeleSec GlobalRoot Class 2,OU=T-Systems Trust Center,O=T-Systems Enterprise Services GmbH,C=DE",
        "CN=T-TeleSec GlobalRoot Class 3,OU=T-Systems Trust Center,O=T-Systems Enterprise Services GmbH,C=DE",
        "CN=Baltimore CyberTrust Root,OU=CyberTrust,O=Baltimore,C=IE",
        "CN=DigiCert Assured ID Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert Assured ID Root G2,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert Assured ID Root G3,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert Global Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert Global Root G2,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert Global Root G3,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert High Assurance EV Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=DigiCert SMIME ECC P384 Root G5,O=DigiCert\, Inc.,C=US",
        "CN=DigiCert SMIME RSA4096 Root G5,O=DigiCert\, Inc.,C=US",
        "CN=DigiCert TLS ECC P384 Root G5,O=DigiCert\, Inc.,C=US",
        "CN=DigiCert TLS RSA4096 Root G5,O=DigiCert\, Inc.,C=US",
        "CN=DigiCert Trusted Root G4,OU=www.digicert.com,O=DigiCert Inc,C=US",
        "CN=Symantec Class 1 Public Primary Certification Authority - G6,OU=Symantec Trust Network,O=Symantec Corporation,C=US",
        "CN=Symantec Class 2 Public Primary Certification Authority - G6,OU=Symantec Trust Network,O=Symantec Corporation,C=US",
        "CN=VeriSign Class 1 Public Primary Certification Authority - G3,OU=(c) 1999 VeriSign\, Inc. - For authorized use only,OU=VeriSign Trust Network,O=VeriSign\, Inc.,C=US",
        "CN=VeriSign Class 2 Public Primary Certification Authority - G3,OU=(c) 1999 VeriSign\, Inc. - For authorized use only,OU=VeriSign Trust Network,O=VeriSign\, Inc.,C=US",
        "CN=DIGITALSIGN GLOBAL ROOT ECDSA CA,O=DigitalSign Certificadora Digital,C=PT",
        "CN=DIGITALSIGN GLOBAL ROOT RSA CA,O=DigitalSign Certificadora Digital,C=PT",
        "CN=CA Disig Root R2,O=Disig a.s.,L=Bratislava,C=SK",
        "CN=GLOBALTRUST 2020,O=e-commerce monitoring GmbH,C=AT",
        "CN=emSign ECC Root CA - C3,O=eMudhra Inc,OU=emSign PKI,C=US",
        "CN=emSign ECC Root CA - G3,O=eMudhra Technologies Limited,OU=emSign PKI,C=IN",
        "CN=emSign Root CA - C1,O=eMudhra Inc,OU=emSign PKI,C=US",
        "CN=emSign Root CA - G1,O=eMudhra Technologies Limited,OU=emSign PKI,C=IN",
        "CN=AffirmTrust Commercial,O=AffirmTrust,C=US",
        "CN=AffirmTrust Networking,O=AffirmTrust,C=US",
        "CN=AffirmTrust Premium,O=AffirmTrust,C=US",
        "CN=AffirmTrust Premium ECC,O=AffirmTrust,C=US",
        "CN=Entrust Root Certification Authority,OU=(c) 2006 Entrust\, Inc.,OU=www.entrust.net/CPS is incorporated by reference,O=Entrust\, Inc.,C=US",
        "CN=Entrust Root Certification Authority - EC1,OU=(c) 2012 Entrust\, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust\, Inc.,C=US",
        "CN=Entrust Root Certification Authority - G2,OU=(c) 2009 Entrust\, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust\, Inc.,C=US",
        "CN=Entrust Root Certification Authority - G4,OU=(c) 2015 Entrust\, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust\, Inc.,C=US",
        "CN=Entrust.net Certification Authority (2048),OU=(c) 1999 Entrust.net Limited,OU=www.entrust.net/CPS_2048 incorp. by ref. (limits liab.),O=Entrust.net",
        "C=DE,O=Atos,CN=Atos TrustedRoot 2011",
        "CN=Atos TrustedRoot Root CA ECC G2 2020,O=Atos,C=DE",
        "C=DE,O=Atos,CN=Atos TrustedRoot Root CA ECC TLS 2021",
        "CN=Atos TrustedRoot Root CA RSA G2 2020,O=Atos,C=DE",
        "C=DE,O=Atos,CN=Atos TrustedRoot Root CA RSA TLS 2021",
        "CN=GDCA TrustAUTH R5 ROOT,O=GUANG DONG CERTIFICATE AUTHORITY CO.\,LTD.,C=CN",
        "CN=GlobalSign,O=GlobalSign,OU=GlobalSign Root CA - R3",
        "CN=GlobalSign,O=GlobalSign,OU=GlobalSign ECC Root CA - R5",
        "CN=GlobalSign,O=GlobalSign,OU=GlobalSign Root CA - R6",
        "CN=GlobalSign Root CA,OU=Root CA,O=GlobalSign nv-sa,C=BE",
        "CN=GlobalSign Root E46,O=GlobalSign nv-sa,C=BE",
        "CN=GlobalSign Root R46,O=GlobalSign nv-sa,C=BE",
        "CN=GlobalSign Secure Mail Root E45,O=GlobalSign nv-sa,C=BE",
        "CN=GlobalSign Secure Mail Root R45,O=GlobalSign nv-sa,C=BE",
        "OU=Go Daddy Class 2 Certification Authority,O=The Go Daddy Group\, Inc.,C=US",
        "CN=Go Daddy Root Certificate Authority - G2,O=GoDaddy.com\, Inc.,L=Scottsdale,ST=Arizona,C=US",
        "OU=Starfield Class 2 Certification Authority,O=Starfield Technologies\, Inc.,C=US",
        "CN=Starfield Root Certificate Authority - G2,O=Starfield Technologies\, Inc.,L=Scottsdale,ST=Arizona,C=US",
        "CN=GlobalSign,O=GlobalSign,OU=GlobalSign ECC Root CA - R4",
        "CN=GTS Root R1,O=Google Trust Services LLC,C=US",
        "CN=GTS Root R2,O=Google Trust Services LLC,C=US",
        "CN=GTS Root R3,O=Google Trust Services LLC,C=US",
        "CN=GTS Root R4,O=Google Trust Services LLC,C=US",
        "CN=Hongkong Post Root CA 3,O=Hongkong Post,L=Hong Kong,ST=Hong Kong,C=HK",
        "C=ES,O=ACCV,OU=PKIACCV,CN=ACCVRAIZ1",
        "CN=AC RAIZ FNMT-RCM SERVIDORES SEGUROS,2.5.4.97=VATES-Q2826004J,OU=Ceres,O=FNMT-RCM,C=ES",
        "OU=AC RAIZ FNMT-RCM,O=FNMT-RCM,C=ES",
        "CN=Staat der Nederlanden Root CA - G3,O=Staat der Nederlanden,C=NL",
        "CN=TUBITAK Kamu SM SSL Kok Sertifikasi - Surum 1,OU=Kamu Sertifikasyon Merkezi - Kamu SM,O=Turkiye Bilimsel ve Teknolojik Arastirma Kurumu - TUBITAK,L=Gebze - Kocaeli,C=TR",
        "CN=HARICA Client ECC Root CA 2021,O=Hellenic Academic and Research Institutions CA,C=GR",
        "CN=HARICA Client RSA Root CA 2021,O=Hellenic Academic and Research Institutions CA,C=GR",
        "CN=HARICA TLS ECC Root CA 2021,O=Hellenic Academic and Research Institutions CA,C=GR",
        "CN=HARICA TLS RSA Root CA 2021,O=Hellenic Academic and Research Institutions CA,C=GR",
        "CN=Hellenic Academic and Research Institutions ECC RootCA 2015,O=Hellenic Academic and Research Institutions Cert. Authority,L=Athens,C=GR",
        "CN=Hellenic Academic and Research Institutions RootCA 2015,O=Hellenic Academic and Research Institutions Cert. Authority,L=Athens,C=GR",
        "CN=IdenTrust Commercial Root CA 1,O=IdenTrust,C=US",
        "CN=IdenTrust Public Sector Root CA 1,O=IdenTrust,C=US",
        "CN=ISRG Root X1,O=Internet Security Research Group,C=US",
        "CN=ISRG Root X2,O=Internet Security Research Group,C=US",
        "CN=vTrus ECC Root CA,O=iTrusChina Co.\,Ltd.,C=CN",
        "CN=vTrus Root CA,O=iTrusChina Co.\,Ltd.,C=CN",
        "CN=Izenpe.com,O=IZENPE S.A.,C=ES",
        "CN=SZAFIR ROOT CA2,O=Krajowa Izba Rozliczeniowa S.A.,C=PL",
        "CN=LAWtrust Root CA2 (4096),O=LAWtrust,C=ZA",
        "CN=e-Szigno Root CA 2017,2.5.4.97=VATHU-23584497,O=Microsec Ltd.,L=Budapest,C=HU",
        "1.2.840.113549.1.9.1=info@e-szigno.hu,CN=Microsec e-Szigno Root CA 2009,O=Microsec Ltd.,L=Budapest,C=HU",
        "CN=Microsoft ECC Root Certificate Authority 2017,O=Microsoft Corporation,C=US",
        "CN=Microsoft RSA Root Certificate Authority 2017,O=Microsoft Corporation,C=US",
        "CN=NAVER Global Root Certification Authority,O=NAVER BUSINESS PLATFORM Corp.,C=KR",
        "CN=NetLock Arany (Class Gold) Főtanúsítvány,OU=Tanúsítványkiadók (Certification Services),O=NetLock Kft.,L=Budapest,C=HU",
        "CN=OISTE WISeKey Global Root GA CA,OU=OISTE Foundation Endorsed,OU=Copyright (c) 2005,O=WISeKey,C=CH",
        "CN=OISTE WISeKey Global Root GB CA,OU=OISTE Foundation Endorsed,O=WISeKey,C=CH",
        "CN=OISTE WISeKey Global Root GC CA,OU=OISTE Foundation Endorsed,O=WISeKey,C=CH",
        "CN=QuoVadis Root CA 1 G3,O=QuoVadis Limited,C=BM",
        "CN=QuoVadis Root CA 2,O=QuoVadis Limited,C=BM",
        "CN=QuoVadis Root CA 2 G3,O=QuoVadis Limited,C=BM",
        "CN=QuoVadis Root CA 3,O=QuoVadis Limited,C=BM",
        "CN=QuoVadis Root CA 3 G3,O=QuoVadis Limited,C=BM",
        "OU=Security Communication RootCA1,O=SECOM Trust.net,C=JP",
        "CN=Security Communication ECC RootCA1,O=SECOM Trust Systems CO.\,LTD.,C=JP",
        "OU=Security Communication RootCA2,O=SECOM Trust Systems CO.\,LTD.,C=JP",
        "CN=Security Communication RootCA3,O=SECOM Trust Systems CO.\,LTD.,C=JP",
        "CN=AAA Certificate Services,O=Comodo CA Limited,L=Salford,ST=Greater Manchester,C=GB",
        "CN=COMODO Certification Authority,O=COMODO CA Limited,L=Salford,ST=Greater Manchester,C=GB",
        "CN=COMODO ECC Certification Authority,O=COMODO CA Limited,L=Salford,ST=Greater Manchester,C=GB",
        "CN=COMODO RSA Certification Authority,O=COMODO CA Limited,L=Salford,ST=Greater Manchester,C=GB",
        "CN=Sectigo Public Email Protection Root E46,O=Sectigo Limited,C=GB",
        "CN=Sectigo Public Email Protection Root R46,O=Sectigo Limited,C=GB",
        "CN=Sectigo Public Server Authentication Root E46,O=Sectigo Limited,C=GB",
        "CN=Sectigo Public Server Authentication Root R46,O=Sectigo Limited,C=GB",
        "CN=USERTrust ECC Certification Authority,O=The USERTRUST Network,L=Jersey City,ST=New Jersey,C=US",
        "CN=USERTrust RSA Certification Authority,O=The USERTRUST Network,L=Jersey City,ST=New Jersey,C=US",
        "CN=UCA Extended Validation Root,O=UniTrust,C=CN",
        "CN=UCA Global G2 Root,O=UniTrust,C=CN",
        "CN=SSL.com Client ECC Root CA 2022,O=SSL Corporation,C=US",
        "CN=SSL.com Client RSA Root CA 2022,O=SSL Corporation,C=US",
        "CN=SSL.com EV Root Certification Authority ECC,O=SSL Corporation,L=Houston,ST=Texas,C=US",
        "CN=SSL.com EV Root Certification Authority RSA R2,O=SSL Corporation,L=Houston,ST=Texas,C=US",
        "CN=SSL.com Root Certification Authority ECC,O=SSL Corporation,L=Houston,ST=Texas,C=US",
        "CN=SSL.com Root Certification Authority RSA,O=SSL Corporation,L=Houston,ST=Texas,C=US",
        "CN=SSL.com TLS ECC Root CA 2022,O=SSL Corporation,C=US",
        "CN=SSL.com TLS RSA Root CA 2022,O=SSL Corporation,C=US",
        "CN=SwissSign Gold CA - G2,O=SwissSign AG,C=CH",
        "CN=SwissSign Silver CA - G2,O=SwissSign AG,C=CH",
        "CN=TWCA Global Root CA,OU=Root CA,O=TAIWAN-CA,C=TW",
        "CN=TWCA Root Certification Authority,OU=Root CA,O=TAIWAN-CA,C=TW",
        "CN=Telia Root CA v2,O=Telia Finland Oyj,C=FI",
        "CN=TeliaSonera Root CA v1,O=TeliaSonera",
        "CN=TrustCor ECA-1,OU=TrustCor Certificate Authority,O=TrustCor Systems S. de R.L.,L=Panama City,ST=Panama,C=PA",
        "CN=TrustCor RootCert CA-1,OU=TrustCor Certificate Authority,O=TrustCor Systems S. de R.L.,L=Panama City,ST=Panama,C=PA",
        "CN=TrustCor RootCert CA-2,OU=TrustCor Certificate Authority,O=TrustCor Systems S. de R.L.,L=Panama City,ST=Panama,C=PA",
        "CN=Secure Global CA,O=SecureTrust Corporation,C=US",
        "CN=SecureTrust CA,O=SecureTrust Corporation,C=US",
        "CN=Trustwave Global Certification Authority,O=Trustwave Holdings\, Inc.,L=Chicago,ST=Illinois,C=US",
        "CN=Trustwave Global ECC P256 Certification Authority,O=Trustwave Holdings\, Inc.,L=Chicago,ST=Illinois,C=US",
        "CN=Trustwave Global ECC P384 Certification Authority,O=Trustwave Holdings\, Inc.,L=Chicago,ST=Illinois,C=US",
        "CN=XRamp Global Certification Authority,O=XRamp Security Services Inc,OU=www.xrampsecurity.com,C=US",
    ];
    let ca_selection = `<select name="ca_selection">`;
    trust_store_cas.forEach(ca => {
        ca_selection += `<option value="${ca}">${ca}</option>`;
    });
    ca_selection += `</select>`;

    console.log(ca_selection);

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
                    ${ca_selection}
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

    // Load trust levels settings
    loadTrustLevelSettings(json_config);

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
                <td colspan="2" class="policy-header btn">
                    ${domain}
                </td>
                <td class="btn policy-header policy-toggle">
                    -
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
        
        rules.forEach(rule => {
            console.log(rule['caSet'] + " has level " + rule['level']);
            // CA Set
            domain_body += `
                <tr>
                    <td class="user-policy-dropdown">
                        <select class="user-policy-dropdown">`;

            Object.entries(json_config['ca-sets']).forEach(entry => {
                const [set_name, _] = entry;
                let selected = (set_name == rule['caSet']) ? "selected" : "";
                domain_body += `
                    <option ${selected}>${set_name}</option>`;
            });

            domain_body += `
                </select></td>
                <td class="user-policy-dropdown">
                    <select class="user-policy-dropdown">`;
            // Trust Level
            Object.entries(json_config['trust-levels']).forEach(entry => {
                const [level_name, _] = entry;
                let selected = (level_name == rule['level']) ? "selected" : "";
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
            </tr>
        </tbody>`

        table_body += domain_header + domain_body;
    });

    table_body += `
        <tbody>
            <tr>
            <td colspan="2" style="padding:0;">
                <input  type="text" placeholder="___" 
                        style="background-color:#F2D995; height: 35px; text-align: center; font-weight: bolder; font-size: larger;">
            </td>
            <td id="user-policy-domain-add" class="btn" style="font-size: larger; font-weight: bolder; background-color:#F2D995;">
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
 * Event Listeners for buttons in user policy table
 */
function setupUserPolicyEventListeners(json_config) {
    // Toggle visibility of policies for specific domain
    let toggle_buttons = document.querySelectorAll('.policy-toggle');
    toggle_buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            // e.target
            let div = e.target.parentElement.parentElement.nextSibling;
            toggleElement(div);
            if (div.hidden) {
                e.target.innerHTML = "<";
            } else {
                e.target.innerHTML = "v"
            }
        });
    });
    // Add policy to domain
    let add_policy_buttons = document.querySelectorAll('.policy-add');
    add_policy_buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            let policy_header = e.target.parentElement.parentElement.previousSibling;
            let domain = policy_header.children[0].children[0].innerHTML.trim();

            let first_caset = Object.entries(json_config['ca-sets'])[0][0]
            json_config['legacy-trust-preference'][domain].push({
                caSet: first_caset,
                level: "Standard Trust"
            });

            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
        });
    });
    // Remove policy from domain
    let del_policy_buttons = document.querySelectorAll('.policy-del');
    del_policy_buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            let caset = e.target.parentElement.children[0].children[0].value;

            let policy_header = e.target.parentElement.parentElement.previousSibling;
            let domain = policy_header.children[0].children[0].innerHTML.trim();
            let indices2bremoved = [];
            json_config['legacy-trust-preference'][domain].forEach(pref => {
                if (pref['caSet'] == caset) {
                    let index = json_config['legacy-trust-preference'][domain].indexOf(pref);
                    console.log("index: " + index)
                    indices2bremoved.push(index);
                    //json_config['legacy-trust-preference'][domain].splice(index,1);
                }
            });
            console.log(indices2bremoved);
            // New preference array without removed
            let prefs = [];
            json_config['legacy-trust-preference'][domain].forEach(pref => {
                let index = json_config['legacy-trust-preference'][domain].indexOf(pref);
                if (!indices2bremoved.includes(index)) {
                    prefs.push(pref);
                }
            });
            console.log(prefs);
            json_config['legacy-trust-preference'][domain] = prefs;

            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
        });
    });
    // Add domain to add policies for
    let domain_add_btn = document.getElementById("user-policy-domain-add");
    domain_add_btn.addEventListener("click", (e) => {
        let domain = e.target.parentElement.children[0].children[0].value;
        if (!json_config['legacy-trust-preference'].hasOwnProperty(domain)) {
            json_config['legacy-trust-preference'][domain] = [];
            importConfigFromJSON(JSON.stringify(json_config));
            reloadSettings();
        }
    });
    
}


/**
 * Lädt die Trust Levels Tabelle
 */
function loadTrustLevelSettings(json_config) {
    let table_rows = "";
    Object.entries(json_config['trust-levels']).forEach(entry => {
        const [key, value] = entry;
        console.log(key + " is " + value);

        let rank_input = `<input type="number" min=1 max=100 value=${value} />`
        let del_btn = `<td class="btn" style="text-align: center;">x</td>`;

        if (key === "Untrusted" || key === "Standard Trust") {
            del_btn = `<td></td>`;
        }
        if (key === "Untrusted") {
            rank_input = ``
        }

        let table_row = `
            <tr>
                <td>${key}</td>
                <td>${rank_input}</td>
                ${del_btn}
            </tr>`
        table_rows += table_row;
    });
    let table_body = document.getElementById('trust-levels-table-body');
    table_body.innerHTML = table_rows += `
        <tr>
            <td colspan="2" class="btn" 
                style=" font-weight: bolder; color: whitesmoke; height:30px; 
                        background-color:#3D7F6E; font-size: larger;">
                +
            </td>
        </tr>`;
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