package handlers

import (
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authUsecase usecase.AuthUseCase
	cfg         *config.Config
}

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=3,max=100"`
	Email    string `json:"email" validate:"required,email,max=100"`
	Password string `json:"password" validate:"required,min=8,max=30"`
	Role     string `json:"role" validate:"required,oneof=student teacher"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func NewAuthHandler(authUsecase usecase.AuthUseCase, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authUsecase: authUsecase,
		cfg:         cfg,
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	// Structural Validation
	if err := utils.ValidateStruct(&req); err != nil {
		return err // Global error handler handles TypeValidation AppError
	}

	err := h.authUsecase.Register(c.Context(), req.Name, req.Email, req.Password, req.Role)
	if err != nil {
		return err // Propagate usecase errors to GlobalErrorHandler
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "user registered successfully",
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	// Structural Validation
	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	accessToken, refreshToken, err := h.authUsecase.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return err // Propagate usecase errors to GlobalErrorHandler
	}

	// Set Refresh Token in secure cookie
	h.setRefreshCookie(c, refreshToken)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"access_token": accessToken,
		},
		"message": "logged in successfully",
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return fiber.NewError(fiber.StatusBadRequest, "missing refresh token cookie")
	}

	err := h.authUsecase.Logout(c.Context(), refreshToken)
	if err != nil {
		return err
	}

	// Invalidate the cookie
	h.clearRefreshCookie(c)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "logged out successfully",
	})
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "missing refresh token cookie")
	}

	newAccessToken, newRefreshToken, err := h.authUsecase.RefreshToken(c.Context(), refreshToken)
	if err != nil {
		return err
	}

	// Set the new rotated refresh token in secure cookie
	h.setRefreshCookie(c, newRefreshToken)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"access_token": newAccessToken,
		},
		"message": "tokens refreshed successfully",
	})
}

func (h *AuthHandler) setRefreshCookie(c *fiber.Ctx, token string) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Expires:  time.Now().AddDate(0, 0, h.cfg.JWTRefreshExpiryDays),
		HTTPOnly: true,
		Secure:   h.cfg.Env == "production",
		SameSite: "Lax",
		Path:     "/api/v1/auth",
	})
}

func (h *AuthHandler) clearRefreshCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   h.cfg.Env == "production",
		SameSite: "Lax",
		Path:     "/api/v1/auth",
	})
}

func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return fiber.NewError(fiber.StatusBadRequest, "missing token parameter")
	}

	err := h.authUsecase.VerifyEmail(c.Context(), token)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "email verified successfully",
	})
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	err := h.authUsecase.ForgotPassword(c.Context(), req.Email)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "if the email exists, a password reset link has been sent",
	})
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=30"`
}

func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	err := h.authUsecase.ResetPassword(c.Context(), req.Token, req.NewPassword)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "password has been reset successfully",
	})
}
