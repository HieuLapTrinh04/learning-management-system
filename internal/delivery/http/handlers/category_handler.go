package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type CategoryHandler struct {
	useCase usecase.CategoryUseCase
}

type CreateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"max=255"`
}

type UpdateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"max=255"`
}

func NewCategoryHandler(useCase usecase.CategoryUseCase) *CategoryHandler {
	return &CategoryHandler{useCase: useCase}
}

func (h *CategoryHandler) Create(c *fiber.Ctx) error {
	var req CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	category, err := h.useCase.Create(c.Context(), req.Name, req.Description)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    category,
		"message": "category created successfully",
	})
}

func (h *CategoryHandler) Update(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid category ID")
	}

	var req UpdateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	category, err := h.useCase.Update(c.Context(), uint(id), req.Name, req.Description)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    category,
		"message": "category updated successfully",
	})
}

func (h *CategoryHandler) Delete(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid category ID")
	}

	err = h.useCase.Delete(c.Context(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "category deleted successfully",
	})
}

func (h *CategoryHandler) GetByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid category ID")
	}

	category, err := h.useCase.GetByID(c.Context(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    category,
	})
}

func (h *CategoryHandler) List(c *fiber.Ctx) error {
	categories, err := h.useCase.List(c.Context())
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    categories,
	})
}
