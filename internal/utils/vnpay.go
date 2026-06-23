package utils

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"net/url"
	"sort"
	"strings"
)

// BuildVNPayURL signs and returns the full VNPay checkout URL.
func BuildVNPayURL(baseURL, secret string, params url.Values) string {
	var keys []string
	for k := range params {
		if k == "vnp_SecureHash" || k == "vnp_SecureHashType" {
			continue
		}
		if len(params.Get(k)) > 0 {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var queryParts []string
	for _, k := range keys {
		// VNPay expects '%20' instead of '+' for spaces
		val := url.QueryEscape(params.Get(k))
		val = strings.ReplaceAll(val, "+", "%20")
		queryParts = append(queryParts, k+"="+val)
	}

	queryStr := strings.Join(queryParts, "&")

	// Calculate secure hash signature
	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(queryStr))
	signature := hex.EncodeToString(h.Sum(nil))

	return baseURL + "?" + queryStr + "&vnp_SecureHash=" + signature
}

// VerifyVNPayHash validates that the incoming callback parameters match the secure hash signature.
func VerifyVNPayHash(secret string, params url.Values) bool {
	secureHash := params.Get("vnp_SecureHash")
	if secureHash == "" {
		return false
	}

	var keys []string
	for k := range params {
		if k == "vnp_SecureHash" || k == "vnp_SecureHashType" {
			continue
		}
		if len(params.Get(k)) > 0 {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var signParts []string
	for _, k := range keys {
		val := url.QueryEscape(params.Get(k))
		val = strings.ReplaceAll(val, "+", "%20")
		signParts = append(signParts, k+"="+val)
	}

	signStr := strings.Join(signParts, "&")

	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(signStr))
	calculatedHash := hex.EncodeToString(h.Sum(nil))

	return strings.ToLower(secureHash) == strings.ToLower(calculatedHash)
}
