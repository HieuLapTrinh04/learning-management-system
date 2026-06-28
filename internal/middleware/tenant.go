package middleware

import (
	"context"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// In-memory cache for fast tenant resolution
var tenantCache = make(map[string]uint)

// TenantResolver middleware resolves the tenant based on the hostname.
func TenantResolver(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		host := c.Get("X-Tenant-Domain")
		if host == "" {
			host = c.Hostname()
		}
		// Remove port if present
		if idx := strings.Index(host, ":"); idx != -1 {
			host = host[:idx]
		}

		// Fast path cache
		if tenantID, exists := tenantCache[host]; exists {
			c.Locals("tenantID", tenantID)
			return c.Next()
		}

		// Find tenant by domain
		var tenant models.Tenant
		if err := db.Where("domain = ?", host).First(&tenant).Error; err != nil {
			// Fallback to Tenant ID 1 (Lumina Academy - the user's original tenant)
			if err := db.First(&tenant, 1).Error; err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"success": false,
					"message": "Tenant domain is invalid and default tenant not found",
				})
			}
		}

		// Cache it
		tenantCache[host] = tenant.ID

		c.Locals("tenantID", tenant.ID)
		
		// Inject into standard context for usecases
		ctx := context.WithValue(c.UserContext(), "tenantID", tenant.ID)
		c.SetUserContext(ctx)

		return c.Next()
	}
}
