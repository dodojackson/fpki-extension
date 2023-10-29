

export const defaultConfig = {
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
    "trust-levels": {
        "Untrusted": 0,
        "Low Trust": 1,
        "Standard Trust": 2,
        "High Trust": 3,
        "Perfect Trust": 4
    },
    "cache-timeout": 3600000,
    "max-connection-setup-time": 1000,
    "proof-fetch-timeout": 10000,
    "proof-fetch-max-tries": 3,
    "mapserver-quorum": 1,
    "mapserver-instances-queried": 1,
    "send-log-entries-via-event": true,
    "wasm-certificate-parsing": true,
    "ca-sets": {
        "All Trust-Store CAs": {
            "description": "All CAs included in your browsers Trust-Store",
            "cas": [
                "CN=Actalis Authentication Root CA,O=Actalis S.p.A./03358520967,L=Milan,C=IT",
                "CN=TunTrust Root CA,O=Agence Nationale de Certification Electronique,C=TN",
                "CN=Amazon Root CA 1,O=Amazon,C=US",
                "CN=Amazon Root CA 2,O=Amazon,C=US",
                "CN=Amazon Root CA 3,O=Amazon,C=US",
                "CN=Amazon Root CA 4,O=Amazon,C=US",
                "CN=Starfield Services Root Certificate Authority - G2,O=Starfield Technologies, Inc.,L=Scottsdale,ST=Arizona,C=US",
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
                "OU=ePKI Root Certification Authority,O=Chunghwa Telecom Co., Ltd.,C=TW",
                "CN=HiPKI Root CA - G1,O=Chunghwa Telecom Co., Ltd.,C=TW",
                "CN=SecureSign RootCA11,O=Japan Certification Services, Inc.,C=JP",
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
                "CN=DigiCert SMIME ECC P384 Root G5,O=DigiCert, Inc.,C=US",
                "CN=DigiCert SMIME RSA4096 Root G5,O=DigiCert, Inc.,C=US",
                "CN=DigiCert TLS ECC P384 Root G5,O=DigiCert, Inc.,C=US",
                "CN=DigiCert TLS RSA4096 Root G5,O=DigiCert, Inc.,C=US",
                "CN=DigiCert Trusted Root G4,OU=www.digicert.com,O=DigiCert Inc,C=US",
                "CN=Symantec Class 1 Public Primary Certification Authority - G6,OU=Symantec Trust Network,O=Symantec Corporation,C=US",
                "CN=Symantec Class 2 Public Primary Certification Authority - G6,OU=Symantec Trust Network,O=Symantec Corporation,C=US",
                "CN=VeriSign Class 1 Public Primary Certification Authority - G3,OU=(c) 1999 VeriSign, Inc. - For authorized use only,OU=VeriSign Trust Network,O=VeriSign, Inc.,C=US",
                "CN=VeriSign Class 2 Public Primary Certification Authority - G3,OU=(c) 1999 VeriSign, Inc. - For authorized use only,OU=VeriSign Trust Network,O=VeriSign, Inc.,C=US",
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
                "CN=Entrust Root Certification Authority,OU=(c) 2006 Entrust, Inc.,OU=www.entrust.net/CPS is incorporated by reference,O=Entrust, Inc.,C=US",
                "CN=Entrust Root Certification Authority - EC1,OU=(c) 2012 Entrust, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust, Inc.,C=US",
                "CN=Entrust Root Certification Authority - G2,OU=(c) 2009 Entrust, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust, Inc.,C=US",
                "CN=Entrust Root Certification Authority - G4,OU=(c) 2015 Entrust, Inc. - for authorized use only,OU=See www.entrust.net/legal-terms,O=Entrust, Inc.,C=US",
                "CN=Entrust.net Certification Authority (2048),OU=(c) 1999 Entrust.net Limited,OU=www.entrust.net/CPS_2048 incorp. by ref. (limits liab.),O=Entrust.net",
                "C=DE,O=Atos,CN=Atos TrustedRoot 2011",
                "CN=Atos TrustedRoot Root CA ECC G2 2020,O=Atos,C=DE",
                "C=DE,O=Atos,CN=Atos TrustedRoot Root CA ECC TLS 2021",
                "CN=Atos TrustedRoot Root CA RSA G2 2020,O=Atos,C=DE",
                "C=DE,O=Atos,CN=Atos TrustedRoot Root CA RSA TLS 2021",
                "CN=GDCA TrustAUTH R5 ROOT,O=GUANG DONG CERTIFICATE AUTHORITY CO.,LTD.,C=CN",
                "CN=GlobalSign,O=GlobalSign,OU=GlobalSign Root CA - R3",
                "CN=GlobalSign,O=GlobalSign,OU=GlobalSign ECC Root CA - R5",
                "CN=GlobalSign,O=GlobalSign,OU=GlobalSign Root CA - R6",
                "CN=GlobalSign Root CA,OU=Root CA,O=GlobalSign nv-sa,C=BE",
                "CN=GlobalSign Root E46,O=GlobalSign nv-sa,C=BE",
                "CN=GlobalSign Root R46,O=GlobalSign nv-sa,C=BE",
                "CN=GlobalSign Secure Mail Root E45,O=GlobalSign nv-sa,C=BE",
                "CN=GlobalSign Secure Mail Root R45,O=GlobalSign nv-sa,C=BE",
                "OU=Go Daddy Class 2 Certification Authority,O=The Go Daddy Group, Inc.,C=US",
                "CN=Go Daddy Root Certificate Authority - G2,O=GoDaddy.com, Inc.,L=Scottsdale,ST=Arizona,C=US",
                "OU=Starfield Class 2 Certification Authority,O=Starfield Technologies, Inc.,C=US",
                "CN=Starfield Root Certificate Authority - G2,O=Starfield Technologies, Inc.,L=Scottsdale,ST=Arizona,C=US",
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
                "CN=vTrus ECC Root CA,O=iTrusChina Co.,Ltd.,C=CN",
                "CN=vTrus Root CA,O=iTrusChina Co.,Ltd.,C=CN",
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
                "CN=Security Communication ECC RootCA1,O=SECOM Trust Systems CO.,LTD.,C=JP",
                "OU=Security Communication RootCA2,O=SECOM Trust Systems CO.,LTD.,C=JP",
                "CN=Security Communication RootCA3,O=SECOM Trust Systems CO.,LTD.,C=JP",
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
                "CN=Trustwave Global Certification Authority,O=Trustwave Holdings, Inc.,L=Chicago,ST=Illinois,C=US",
                "CN=Trustwave Global ECC P256 Certification Authority,O=Trustwave Holdings, Inc.,L=Chicago,ST=Illinois,C=US",
                "CN=Trustwave Global ECC P384 Certification Authority,O=Trustwave Holdings, Inc.,L=Chicago,ST=Illinois,C=US",
                "CN=XRamp Global Certification Authority,O=XRamp Security Services Inc,OU=www.xrampsecurity.com,C=US"
            ]
        }
    },
    "legacy-trust-preference": {
        "*": {
            "All Trust-Store CAs": "Standard Trust"
        }
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