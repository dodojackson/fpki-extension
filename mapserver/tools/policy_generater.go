package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/netsec-ethz/fpki/pkg/common"
	"github.com/netsec-ethz/fpki/pkg/domainowner"
	"github.com/netsec-ethz/fpki/pkg/logverifier"
	PCA "github.com/netsec-ethz/fpki/pkg/pca"
	"github.com/netsec-ethz/fpki/pkg/policylog/client"
)

func main() {
	issuePCandRPC("google.com")
}

func issuePCandRPC(domainName string) {
	flag.Parse()
	prepareTestFolder()

	domains := []string{"amazon.com", "baidu.com", "pay.amazon.com", "m.media-amazon.com", "ethz.ch", "example.de"}

	var policies []common.Policy
	// generate SP
	policies = append(policies, common.Policy{
		TrustedCA:         []string{"US CA"},
		AllowedSubdomains: []string{"pay.amazon.com"},
	})

	policies = append(policies, common.Policy{
		TrustedCA:         []string{"US CA"},
		AllowedSubdomains: []string{""},
	})

	policies = append(policies, common.Policy{
		TrustedCA:         []string{"US CA"},
		AllowedSubdomains: []string{""},
	})

	policies = append(policies, common.Policy{
		TrustedCA:         []string{"US CA"},
		AllowedSubdomains: nil,
	})

	policies = append(policies, common.Policy{
		TrustedCA:         nil,
		AllowedSubdomains: []string{"netsec.ethz.ch"},
	})
	// example.com (TEST)
	policies = append(policies, common.Policy{
		TrustedCA:         []string{"Example CA"},
		AllowedSubdomains: []string{"store.example.de", "allowed.example.de"},
	})

	// init domain owner
	do := domainowner.NewDomainOwner()

	// new PCA
	pca, err := PCA.NewPCA("./tools/config/pca_config.json")
	if err != nil {
		panicAndQuit(err)
	}

	for i, domain := range domains {
		rcsr, err := do.GenerateRCSR(domain, 1)
		if err != nil {
			panicAndQuit(err)
		}
		if i == 0 && len(rcsr.PRCSignature) != 0 {
			panic("rcsr error: should not have RPCSignature")
		}
		err = pca.SignAndLogRCSR(rcsr)
		if err != nil {
			panicAndQuit(err)
		}
	}

	adminClient, err := client.GetAdminClient("./tools/config/adminclient_config.json")
	if err != nil {
		panicAndQuit(err)
	}

	// create new tree
	tree, err := adminClient.CreateNewTree()
	if err != nil {
		panicAndQuit(err)
	}

	// init log client
	logClient, err := client.NewLogClient("./tools/config/logclient_config.json", tree.TreeId)
	if err != nil {
		panicAndQuit(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*time.Duration(100))
	defer cancel()

	// queue RPC
	result, err := logClient.QueueRPCs(ctx)
	if err != nil {
		panicAndQuit(err)
	}

	if len(result.AddLeavesErrs) != 0 || len(result.RetrieveLeavesErrs) != 0 {
		panicAndQuit(fmt.Errorf("queue error"))
	}

	// read SPT and verify
	err = pca.ReceiveSPTFromPolicyLog()
	if err != nil {
		panicAndQuit(err)
	}

	fileNames, err := ioutil.ReadDir("./file_exchange/rpc")
	if err != nil {
		panicAndQuit(err)
	}

	if len(fileNames) != 0 {
		fmt.Println(len(fileNames))
		panicAndQuit(fmt.Errorf("rpc num error"))
	}

	fileNames, err = ioutil.ReadDir("./file_exchange/spt")
	if err != nil {
		panicAndQuit(err)
	}

	if len(fileNames) != 0 {
		panicAndQuit(fmt.Errorf("spt num error"))
	}

	verifier := logverifier.NewLogVerifier(nil)

	rpcs := pca.ReturnValidRPC()

	for _, rpcWithSPT := range rpcs {
		err = verifier.VerifyRPC(rpcWithSPT)
		if err != nil {
			panicAndQuit(err)
		}
	}

	if len(rpcs) != len(domains) {
		panicAndQuit(fmt.Errorf("rpcs num error"))
	}

	for i, p := range policies {
		psr, err := do.GeneratePSR(domains[i], p)
		if err != nil {
			panicAndQuit(err)
		}

		err = pca.SignAndLogSP(psr)
		if err != nil {
			panicAndQuit(err)
		}
	}

	logClient.QueueSPs(ctx)

	err = pca.ReceiveSPTFromPolicyLog()
	if err != nil {
		panicAndQuit(err)
	}

	if len(result.AddLeavesErrs) != 0 || len(result.RetrieveLeavesErrs) != 0 {
		panicAndQuit(fmt.Errorf("queue error SP"))
	}

	err = pca.OutputRPCAndSP()
	if err != nil {
		panicAndQuit(err)
	}

	fmt.Println("test succeed!")
	os.RemoveAll("./file_exchange")
}

func prepareTestFolder() {
	err := os.MkdirAll("./file_exchange", os.ModePerm)
	if err != nil {
		panicAndQuit(err)
	}

	err = os.MkdirAll("./file_exchange/rpc", os.ModePerm)
	if err != nil {
		panicAndQuit(err)
	}

	err = os.MkdirAll("./file_exchange/sp", os.ModePerm)
	if err != nil {
		panicAndQuit(err)
	}

	err = os.MkdirAll("./file_exchange/spt", os.ModePerm)
	if err != nil {
		panicAndQuit(err)
	}

	err = os.MkdirAll("./file_exchange/policylog/trees_config", os.ModePerm)
	if err != nil {
		panicAndQuit(err)
	}
}

func panicAndQuit(err error) {
	os.RemoveAll("./file_exchange")
	panic(err)
}
