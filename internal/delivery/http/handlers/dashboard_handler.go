package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	useCase usecase.DashboardUseCase
}

func NewDashboardHandler(useCase usecase.DashboardUseCase) *DashboardHandler {
	return &DashboardHandler{useCase: useCase}
}

func (h *DashboardHandler) getTeacherID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *DashboardHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *DashboardHandler) GetAdminAnalytics(c *fiber.Ctx) error {
	valTenant := c.Locals("token_tenant_id")
	tenantID, _ := valTenant.(uint)
	
	stats, err := h.useCase.GetAdminStats(c.UserContext(), tenantID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}

func (h *DashboardHandler) GetTeacherAnalytics(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	stats, err := h.useCase.GetTeacherStats(c.UserContext(), teacherID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}

func (h *DashboardHandler) GetStudentAnalytics(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	stats, err := h.useCase.GetStudentStats(c.UserContext(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}
