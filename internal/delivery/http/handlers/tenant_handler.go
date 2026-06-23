package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type TenantHandler struct {
	db *gorm.DB
}

func NewTenantHandler(db *gorm.DB) *TenantHandler {
	return &TenantHandler{db: db}
}

func (h *TenantHandler) GetCurrentTenant(c *fiber.Ctx) error {
	tenantID, ok := c.Locals("tenantID").(uint)
	if !ok {
		return apperrors.NewAppError(apperrors.TypeInternal, "tenant not resolved", nil)
	}

	var tenant models.Tenant
	if err := h.db.First(&tenant, tenantID).Error; err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "tenant not found in db", err)
	}

	return c.JSON(fiber.Map{
		"id":          tenant.ID,
		"name":        tenant.Name,
		"domain":      tenant.Domain,
		"logo_url":    tenant.LogoURL,
		"theme_color": tenant.ThemeColor,
	})
}
