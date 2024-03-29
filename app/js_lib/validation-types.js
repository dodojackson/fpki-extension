import {errorTypes, FpkiError} from "./errors.js"
import {mapGetList} from "./helper.js"
import {getSubject} from "./x509utils.js"


export const PolicyAttributes = {
    TRUSTED_CA: "Trusted CA",
    SUBDOMAINS: "Subdomains"
};

export const AllPolicyAttributes = [
    PolicyAttributes.TRUSTED_CA,
    PolicyAttributes.SUBDOMAINS
];

export const EvaluationResult = {
    SUCCESS: "success",
    FAILURE: "failure"
};

/**
 * holds the assessed trust info (the trust level of the root certificate and
 * the trust preference where this trust level was derived from) of a certain
 * certificate (either received via TLS handshake or via a mapserver).
 *
 * If this object describes the trust info of a certificate from a mapserver, it
 * additionally includes possible violations regarding the TLS certificate
 * (e.g., it is signed by a more highly trusted CA)
 */
export class LegacyTrustInfo {
    constructor(cert, certChain, rootCaTrustLevel, originTrustPreference, violation) {
        this.cert = cert;
        this.certChain = certChain;
        this.rootCaTrustLevel = rootCaTrustLevel;
        this.originTrustPreference = originTrustPreference;
        this.violation = violation;
        this.evaluationResult = EvaluationResult.FAILURE;
    }
}

/**
 * combines trust information of multiple certificates issued for a given domain
 * from a single mapserver
 */
export class LegacyTrustDecision {
    /**
     * 
     * @param {*} mapserver 
     * @param {String} domain 
     * @param {*} connectionTrustInfo 
     * @param {LegacyTrustInfo[]} certificateTrustInfos 
     */
    constructor(mapserver, domain, connectionTrustInfo, certificateTrustInfos) {
        this.type = "legacy";
        this.mapserver = mapserver;
        this.domain = domain;
        this.connectionTrustInfo = connectionTrustInfo;
        this.certificateTrustInfos = certificateTrustInfos;
        this.decision = hasFailedValidations(this) ? "negative" : "positive";
    }

    // maybe we don't need to merge because we always stop as soon as the first
    // negative decision is made
    merge(other) {
        if (this.domain !== other.domain) {
            throw new FpkiError(errorTypes.INTERNAL_ERROR, "Merging trust decisions for different domains");
        }
        if (this.connectionTrustInfo !== other.connectionTrustInfo) {
            throw new FpkiError(errorTypes.INTERNAL_ERROR, "Merging trust decisions for different certificates");
        }
        this.certificateTrustInfos.push(...other.certificateTrustInfos);
    }
}

/**
 * contains an evaluation result for a certain policy evaluated over a specific
 * domain (i.e., the domain that was queried or one of its ancestor domains)
 */
export class PolicyEvaluation {
    constructor(domain, attribute, evaluationResult, trustLevel, originTrustPreference) {
        this.domain = domain;
        this.attribute = attribute;
        this.evaluationResult = evaluationResult;
        this.trustLevel = trustLevel;
        this.originTrustPreference = originTrustPreference;
    }
}

/**
 * combines multiple policy evaluation results for a single policy. For example,
 * there might be an evaluation result for the allowed subdomains and for the
 * allowed issuers.
 * 
 */
export class PolicyTrustInfo {
    constructor(pca, policyDomain, policyAttributes, evaluations) {
        this.pca = pca;
        this.policyDomain = policyDomain;
        this.policyAttributes = policyAttributes;
        this.evaluations = evaluations;
    }
}

/**
 * combines trust information of multiple policies (possibly issued by different
 * PCAs) issued for a given domain from a single mapserver
 * 
 */
export class PolicyTrustDecision {
    constructor(mapserver, domain, connectionCert, connectionCertChain, policyTrustInfos, decision="negative") {
        this.type = "policy";
        this.mapserver = mapserver;
        this.domain = domain;
        this.connectionCert = connectionCert;
        this.connectionCertChain = connectionCertChain;
        this.policyTrustInfos = policyTrustInfos;
        this.decision = hasFailedValidations(this) ? "negative" : "positive";
    }

    mergeIdenticalPolicies() {
        const newKeys = this.policyTrustInfos.map(ti => {
            return {pca: ti.pca, policy: ti.policy};
        });
        const policyMap = new Map();
        this.policyTrustInfos.forEach(ti => {
            const policyWithPca = {pca: ti.pca, policyDomain: ti.policyDomain, policyAttributes: ti.policyAttributes};
            const policyWithPcaStr = JSON.stringify(policyWithPca, (key, value) => {
                return value;
                // if (!key || key === "pca" || key === "policyDomain" || key === "policyAttributes" || key === "TrustedCA" || key === "AllowedSubdomains" || Array.isArray(value) || !isNaN(key)) {
                    // return value;
                // } else {
                    // return undefined;
                // }
            });
            policyMap.set(policyWithPcaStr, mapGetList(policyMap, policyWithPcaStr).concat(ti.evaluations));
        });
        this.policyTrustInfos = Array.from(policyMap.entries()).map(([policyWithPcaStr, evaluations]) => {
            const {pca, policyDomain, policyAttributes} = JSON.parse(policyWithPcaStr);
            return new PolicyTrustInfo(pca, policyDomain, policyAttributes, evaluations);
        });
    }
}


/**
 * 
 * @param {PolicyTrustDecision} policyTrustDecision 
 * @returns {Boolean}
 */
export function hasApplicablePolicy(policyTrustDecision) {
    return policyTrustDecision.policyTrustInfos.some(pti => pti.evaluations.length > 0);
}


/**
 * Checks if one of the `Trust Infos` has `EvaluationResult.FAILURE` as its
 * evaluationResult.
 * 
 * @param {LegacyTrustDecision | PolicyTrustDecision} trustDecision 
 * @returns {Boolean}
 */
export function hasFailedValidations(trustDecision) {
    if (trustDecision.type === "policy") {
        return trustDecision.policyTrustInfos.some(pti => pti.evaluations.some(e => e.evaluationResult === EvaluationResult.FAILURE));
    } else {
        
        // TEST TEST -->
        console.log("VALIDATION: Evaluation happening");
        console.log(trustDecision.certificateTrustInfos);
        trustDecision.certificateTrustInfos.forEach(cti => {
            console.log(cti.evaluationResult);
        });
        if (trustDecision.certificateTrustInfos.some(cti => cti.evaluationResult === EvaluationResult.FAILURE)) {
            console.log("VALIDATION: Validation negative");
        } else {
            console.log("VALIDATION: Validation positive");
        }
        // <-- TEST TEST

        return trustDecision.certificateTrustInfos.some(cti => cti.evaluationResult === EvaluationResult.FAILURE);
    }
}


/**
 * 
 * 
 * @param {LegacyTrustDecision | PolicyTrustDecision} trustDecision 
 * @returns {string[]}
 */
export function getShortErrorMessages(trustDecision) {
    const errorMessages = [];
    let trustInfos;
    if (trustDecision.type === "policy") {
        trustInfos = trustDecision.policyTrustInfos;
    } else {
        trustInfos = trustDecision.certificateTrustInfos;
    }
    trustInfos.forEach(ti => {
        if (trustDecision.type === "policy") {
            ti.evaluations.forEach(e => {
                errorMessages.push(getPolicyErrorMessage(trustDecision, ti, e));
            });
        } else {
            errorMessages.push(getLegacyErrorMessage(trustDecision, ti));
        }
    });
    return errorMessages;
}


function getPolicyErrorMessage(trustDecision, trustInfo, evaluation) {
    let errorMessage = "";
    errorMessage += "[policy mode] ";
    if (evaluation.attribute === PolicyAttributes.TRUSTED_CA) {
        errorMessage += "Detected certificate issued by an invalid CA: " + getSubject(trustDecision.connectionCertChain[trustDecision.connectionCertChain.length - 1]);
    } else if (evaluation.attribute === PolicyAttributes.SUBDOMAINS) {
        errorMessage += "Detected certificate issued for a domain that is not allowed: " + trustDecision.domain;
    }
    errorMessage += " [policy issued by PCA: ";
    errorMessage += trustInfo.pca;
    errorMessage += "]";
    return errorMessage;
}


/**
 * Builds some error message, telling me that there is a more highly 
 * trusted certificate and by which CA.
 * 
 * @param {LegacyTrustDecision} trustDecision 
 * @param {LegacyTrustInfo} trustInfo 
 * @returns {String}
 */
function getLegacyErrorMessage(trustDecision, trustInfo) {
    let errorMessage = "";
    errorMessage += "[legacy mode] Detected certificate issued by a CA that is more highly trusted than ";
    // Subject of the last certificate of the chain => ?!
    errorMessage += getSubject(trustDecision.connectionTrustInfo.certChain[trustDecision.connectionTrustInfo.certChain.length - 1]);
    errorMessage += " [certificate issued by CA: ";
    if (trustInfo.certChain.length === 0) {
        errorMessage += "unknown";
    } else {
        errorMessage += getSubject(trustInfo.certChain[trustInfo.certChain.length - 1]);
    }
    errorMessage += "]";
    return errorMessage;
}
