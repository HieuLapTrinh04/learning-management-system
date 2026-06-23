package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type GamificationHandler struct {
	gamificationUseCase usecase.GamificationUseCase
}

func NewGamificationHandler(gamificationUseCase usecase.GamificationUseCase) *GamificationHandler {
	return &GamificationHandler{gamificationUseCase: gamificationUseCase}
}

func (h *GamificationHandler) GetMyProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	profile, err := h.gamificationUseCase.GetUserGamificationProfile(c.Context(), userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    profile,
	})
}

func (h *GamificationHandler) TrackActivity(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	currentStreak, awardedPoints, err := h.gamificationUseCase.TrackDailyActivity(c.Context(), userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"current_streak": currentStreak,
			"awarded_points": awardedPoints,
		},
	})
}

func (h *GamificationHandler) GetLeaderboard(c *fiber.Ctx) error {
	// Parse limit, default 10
	limit := c.QueryInt("limit", 10)
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	leaders, err := h.gamificationUseCase.GetLeaderboard(c.Context(), limit)
	if err != nil {
		return err
	}

	// Remove sensitive info for public leaderboard
	var safeLeaders []fiber.Map
	for _, l := range leaders {
		safeLeaders = append(safeLeaders, fiber.Map{
			"id":             l.ID,
			"name":           l.Name,
			"avatar_url":     l.AvatarURL,
			"points":         l.Points,
			"current_streak": l.CurrentStreak,
			"highest_streak": l.HighestStreak,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    safeLeaders,
	})
}
