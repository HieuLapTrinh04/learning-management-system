package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestAuthAndRBACMiddlewares(t *testing.T) {
	// 1. Setup mock config & secret
	cfg := &config.Config{
		JWTAccessSecret: "test_jwt_access_secret_key_12345",
	}

	// 2. Setup mock Fiber application
	app := fiber.New()

	// Register a test protected endpoint
	app.Get("/test/teacher-only", 
		AuthRequired(cfg), 
		RolesAllowed("teacher"), 
		func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusOK)
		},
	)

	// 3. Scenario 1: Request without authorization header/token
	req1 := httptest.NewRequest(http.MethodGet, "/test/teacher-only", nil)
	resp1, err := app.Test(req1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, resp1.StatusCode)

	// Scenario 2: Request with invalid signature/corrupted token
	req2 := httptest.NewRequest(http.MethodGet, "/test/teacher-only", nil)
	req2.Header.Set("Authorization", "Bearer invalidtokenbody")
	resp2, err := app.Test(req2)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, resp2.StatusCode)

	// Generate standard test tokens
	studentToken, err := utils.GenerateAccessToken(1, 1, "student", cfg.JWTAccessSecret, 15)
	assert.NoError(t, err)
	teacherToken, err := utils.GenerateAccessToken(2, 1, "teacher", cfg.JWTAccessSecret, 15)
	assert.NoError(t, err)

	// Scenario 3: Request with valid student token (Insufficient Permission)
	req3 := httptest.NewRequest(http.MethodGet, "/test/teacher-only", nil)
	req3.Header.Set("Authorization", "Bearer "+studentToken)
	resp3, err := app.Test(req3)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusForbidden, resp3.StatusCode)

	// Scenario 4: Request with valid teacher token (Success)
	req4 := httptest.NewRequest(http.MethodGet, "/test/teacher-only", nil)
	req4.Header.Set("Authorization", "Bearer "+teacherToken)
	resp4, err := app.Test(req4)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp4.StatusCode)
}
