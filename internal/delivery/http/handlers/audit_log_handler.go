package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type AuditLogHandler struct {
	auditUseCase usecase.AuditLogUseCase
}

func NewAuditLogHandler(auditUseCase usecase.AuditLogUseCase) *AuditLogHandler {
	return &AuditLogHandler{auditUseCase: auditUseCase}
}

func (h *AuditLogHandler) GetLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	action := c.Query("action", "")
	entity := c.Query("entity", "")
	search := c.Query("search", "")

	logs, total, err := h.auditUseCase.GetLogs(c.Context(), page, limit, action, entity, search)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"logs":  logs,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}
