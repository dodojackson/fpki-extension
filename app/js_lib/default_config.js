let default_config = {
    "mapservers": [
        {
            "identity": "local-mapserver",
            "domain": "http://localhost:8080",
            "querytype": "lfpki-http-get"
        },
        {
            "identity": "ETH-mapserver-top-100k",
            "domain": "http://129.132.55.210:8080",
            "querytype": "lfpki-http-get"
        }
    ],
    "cache-timeout": 3600000,
    "max-connection-setup-time": 1000,
    "proof-fetch-timeout": 10000,
    "proof-fetch-max-tries": 3,
    "mapserver-quorum": 1,
    "mapserver-instances-queried": 1,
    "send-log-entries-via-event": true,
    "wasm-certificate-parsing": true,
    "ca-sets": {
        "US CA": [
            "CN=GTS CA 1C3,O=Google Trust Services LLC,C=US",
            "CN=GTS Root R1,O=Google Trust Services LLC,C=US",
            "CN=Amazon,OU=Server CA 1B,O=Amazon,C=US",
            "CN=Amazon Root CA 1,O=Amazon,C=US",
            "CN=DigiCert Global CA G2,O=DigiCert Inc,C=US",
            "CN=DigiCert Global Root G2,OU=www.digicert.com,O=DigiCert Inc,C=US"
        ],
        "Microsoft CA": [
            "CN=Baltimore CyberTrust Root,OU=CyberTrust,O=Baltimore,C=IE",
            "CN=DigiCert Global Root CA,OU=www.digicert.com,O=DigiCert Inc,C=US"
        ]
    },
    "legacy-trust-preference": {
        "microsoft.com": [
            {
                "caSet": "Microsoft CA",
                "level": 1
            }
        ],
        "bing.com": [
            {
                "caSet": "Microsoft CA",
                "level": 1
            }
        ]
    },
    "policy-trust-preference": {
        "*": [
            {
                "pca": "pca",
                "level": 1
            }
        ]
    },
    "root-pcas": {
        "pca": "local PCA for testing purposes"
    },
    "root-cas": {
        "GTS CA 1C3": "description: ...",
        "DigiCert Global Root CA": "description: ...",
        "TrustAsia TLS RSA CA": "description: ...",
        "DigiCert SHA2 Secure Server CA": "description: ...",
        "DigiCert Secure Site CN CA G3": "description: ...",
        "GlobalSign Organization Validation CA - SHA256 - G2": "description: ...",
        "DigiCert TLS Hybrid ECC SHA384 2020 CA1": "description: ..."
    }
}