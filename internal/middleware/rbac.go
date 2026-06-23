package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// RolesAllowed restricts access to users possessing specific roles.
func RolesAllowed(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleVal := c.Locals("user_role")
		if roleVal == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "unauthorized session",
			})
		}

		userRole, ok := roleVal.(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "access denied: invalid role format",
			})
		}

		// Check if user's role is in the allowed roles list
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "access denied: insufficient permissions",
		})
	}
}
