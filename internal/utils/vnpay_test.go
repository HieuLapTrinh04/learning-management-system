package utils

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestVNPaySignatureAndVerification(t *testing.T) {
	secret := "EBTCSAQBPMJIKESJZQCSOXXBMRYCHUXE"
	baseURL := "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"

	params := url.Values{}
	params.Set("vnp_TmnCode", "2QX1X150")
	params.Set("vnp_Amount", "1000000")
	params.Set("vnp_Command", "pay")
	params.Set("vnp_CreateDate", "20260616160000")
	params.Set("vnp_CurrCode", "VND")
	params.Set("vnp_IpAddr", "127.0.0.1")
	params.Set("vnp_Locale", "vn")
	params.Set("vnp_OrderInfo", "Thanh toan don hang test")
	params.Set("vnp_OrderType", "other")
	params.Set("vnp_ReturnUrl", "http://localhost:3000/callback")
	params.Set("vnp_TxnRef", "TXN123456")
	params.Set("vnp_Version", "2.1.0")

	// 1. Build payment URL with secure hash signature
	paymentURL := BuildVNPayURL(baseURL, secret, params)
	
	assert.Contains(t, paymentURL, baseURL)
	assert.Contains(t, paymentURL, "vnp_SecureHash=")
	assert.Contains(t, paymentURL, "vnp_TxnRef=TXN123456")

	// Parse parameters back from generated URL
	parsedURL, err := url.Parse(paymentURL)
	assert.NoError(t, err)

	queryParams := parsedURL.Query()
	
	// 2. Verify valid hash callback parameters
	isValid := VerifyVNPayHash(secret, queryParams)
	assert.True(t, isValid)

	// 3. Verify fail case when parameters are altered
	corruptedParams := queryParams
	corruptedParams.Set("vnp_Amount", "2000000") // changed payment amount
	isCorruptedValid := VerifyVNPayHash(secret, corruptedParams)
	assert.False(t, isCorruptedValid)

	// 4. Verify fail case when secure hash signature is missing
	missingHashParams := queryParams
	missingHashParams.Del("vnp_SecureHash")
	isMissingHashValid := VerifyVNPayHash(secret, missingHashParams)
	assert.False(t, isMissingHashValid)
}
