package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	password := "securepassword123"

	// 1. Test hashing
	hash, err := HashPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)

	// 2. Test correct password verification
	isMatch := CheckPasswordHash(password, hash)
	assert.True(t, isMatch)

	// 3. Test incorrect password verification
	isNotMatch := CheckPasswordHash("wrongpassword", hash)
	assert.False(t, isNotMatch)
}
