package middleware

import (
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// AuthRequired protects routes against unauthenticated users.
func AuthRequired(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var tokenStr string
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenStr = parts[1]
			}
		}

	// Removed query token fallback for enhanced security (WS now uses Ticket mechanism)

		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing or invalid authorization token",
			})
		}

		claims, err := utils.ParseToken(tokenStr, cfg.JWTAccessSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or expired token",
			})
		}

		// Verify tenant isolation
		currentTenantID := c.Locals("tenantID")
		if currentTenantID != nil && claims.TenantID != currentTenantID.(uint) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "token belongs to a different academy tenant",
			})
		}

		// Inject user id and role into request context locals
		c.Locals("user_id", claims.UserID)
		c.Locals("user_role", claims.Role)
		c.Locals("token_tenant_id", claims.TenantID)

		return c.Next()
	}
}
