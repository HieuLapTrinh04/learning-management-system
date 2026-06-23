package middleware

import (
	"context"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// In-memory cache for fast tenant resolution
var tenantCache = make(map[string]uint)

// TenantResolver middleware resolves the tenant based on the hostname.
func TenantResolver(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		host := c.Hostname()
		// Remove port if present
		if idx := strings.Index(host, ":"); idx != -1 {
			host = host[:idx]
		}

		// Fast path cache
		if tenantID, exists := tenantCache[host]; exists {
			c.Locals("tenantID", tenantID)
			return c.Next()
		}

		// Fallback to DB
		var tenant models.Tenant
		if err := db.Where("domain = ? AND is_active = ?", host, true).First(&tenant).Error; err != nil {
			// If not found by domain, fallback to default tenant (ID=1) for localhost/development
			if host == "localhost" || host == "127.0.0.1" {
				if err := db.First(&tenant, 1).Error; err != nil {
					return apperrors.NewAppError(apperrors.TypeNotFound, "tenant not found", err)
				}
			} else {
				return apperrors.NewAppError(apperrors.TypeNotFound, "tenant domain not registered", err)
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
