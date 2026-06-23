package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userUseCase   usecase.UserUseCase
	storageClient utils.StorageClient
}

func NewUserHandler(userUseCase usecase.UserUseCase, storageClient utils.StorageClient) *UserHandler {
	return &UserHandler{
		userUseCase:   userUseCase,
		storageClient: storageClient,
	}
}

func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	user, err := h.userUseCase.GetMe(c.Context(), userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    user,
	})
}

type UpdateProfileRequest struct {
	Name            string `json:"name"`
	AvatarURL       string `json:"avatar_url"`
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	// Basic validation is done manually or using Validator
	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	err := h.userUseCase.UpdateProfile(c.Context(), userID, req.Name, req.AvatarURL, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "profile updated successfully",
	})
}

func (h *UserHandler) UploadAvatar(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "No image file found in request")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to open image file")
	}
	defer file.Close()

	if h.storageClient == nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Storage client not configured")
	}

	// 1. Validate File Size (Max 5MB)
	if fileHeader.Size > 5*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "Image file exceeds the 5MB limit")
	}

	// Generate a unique filename
	uniqueName := "avatar_" + fileHeader.Filename

	imageURL, err := h.storageClient.UploadFile(c.Context(), file, uniqueName, "avatars")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to upload image")
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":   true,
		"image_url": imageURL,
	})
}

func (h *UserHandler) GetAdminUsers(c *fiber.Ctx) error {
	role := c.Query("role", "all")
	status := c.Query("status", "all")

	users, err := h.userUseCase.GetAdminUsers(c.Context(), role, status)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    users,
	})
}

type UpdateUserStatusReq struct {
	IsActive bool `json:"is_active"`
}

func (h *UserHandler) UpdateUserStatus(c *fiber.Ctx) error {
	adminID, ok := c.Locals("user_id").(uint)
	if !ok || adminID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	targetUserID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user ID")
	}

	var req UpdateUserStatusReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	err = h.userUseCase.UpdateUserStatus(c.Context(), adminID, uint(targetUserID), req.IsActive)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user status updated successfully",
	})
}

type UpdateUserRoleReq struct {
	Role string `json:"role"`
}

func (h *UserHandler) UpdateUserRole(c *fiber.Ctx) error {
	adminID, ok := c.Locals("user_id").(uint)
	if !ok || adminID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	targetUserID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user ID")
	}

	var req UpdateUserRoleReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	err = h.userUseCase.UpdateUserRole(c.Context(), adminID, uint(targetUserID), req.Role)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user role updated successfully",
	})
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	adminID, ok := c.Locals("user_id").(uint)
	if !ok || adminID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	targetUserID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid user ID")
	}

	err = h.userUseCase.DeleteUser(c.Context(), adminID, uint(targetUserID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user deleted successfully",
	})
}
