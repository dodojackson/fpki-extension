import { getUrlParameter } from "../../js_lib/helper.js"

document.addEventListener('DOMContentLoaded', function() {
    try {
        document.getElementById('goBackButton').addEventListener('click', function() {
            window.history.go(-1);
        });
        document.getElementById('downloadErrorReport').addEventListener('click', function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    } catch (e) {
        console.log("block page (other error) button setup: " + e);
    }
});

// allow popup script to fetch document url of the blocked webpage
browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.request === 'get_dom_url') {
        return Promise.resolve({ domUrl: getUrlParameter("url") });
    }
});

const fillIn = new Map();
fillIn.set("errorShortDescErrorMessage", "reason");
fillIn.set("errorShortDescDomain", "domain");

fillIn.forEach((param, id) => {
    const reasonElement = document.getElementById(id);
    reasonElement.innerHTML = getUrlParameter(param);
});

function addErrorReport() {
    const errorReportElement = document.getElementById("errorReport");
    let report = `
Time: ${new Date()}
URL: ${getUrlParameter("url")}
Requested domain: ${getUrlParameter("domain")}
Error: ${getUrlParameter("reason")}
Stacktrace: ${getUrlParameter("stacktrace")}
Leaf Certificate Fingerprint: ${getUrlParameter("fingerprint")}
`;
    errorReportElement.innerHTML = report;
    const errorReportDiv = document.getElementById("errorReportDiv");
    errorReportDiv.style.display = "none";
}
addErrorReport();
