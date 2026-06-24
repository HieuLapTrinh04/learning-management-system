//go:build ignore

package main

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"time"
)

func main() {
	logger.Log.Sugar().Infoln("Generating self-signed certificate for testing...")

	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to generate private key: %v", err)
	}

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, err := rand.Int(rand.Reader, serialNumberLimit)
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to generate serial number: %v", err)
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"LMS Test Corp"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1")},
		DNSNames:              []string{"localhost"},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to create certificate: %v", err)
	}

	certsDir := filepath.Join(".", "nginx", "certs")
	if err := os.MkdirAll(certsDir, 0755); err != nil {
		logger.Log.Sugar().Fatalf("Failed to create certs directory: %v", err)
	}

	certOut, err := os.Create(filepath.Join(certsDir, "fullchain.pem"))
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to open fullchain.pem for writing: %v", err)
	}
	defer certOut.Close()

	if err := pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		logger.Log.Sugar().Fatalf("Failed to write data to fullchain.pem: %v", err)
	}
	logger.Log.Sugar().Infoln("Successfully created fullchain.pem")

	keyOut, err := os.OpenFile(filepath.Join(certsDir, "privkey.pem"), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to open privkey.pem for writing: %v", err)
	}
	defer keyOut.Close()

	privBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		logger.Log.Sugar().Fatalf("Unable to marshal ECDSA private key: %v", err)
	}

	if err := pem.Encode(keyOut, &pem.Block{Type: "EC PRIVATE KEY", Bytes: privBytes}); err != nil {
		logger.Log.Sugar().Fatalf("Failed to write data to privkey.pem: %v", err)
	}
	logger.Log.Sugar().Infoln("Successfully created privkey.pem")
}
