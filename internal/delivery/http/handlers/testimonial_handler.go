package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type TestimonialHandler struct {
	useCase usecase.TestimonialUseCase
}

func NewTestimonialHandler(useCase usecase.TestimonialUseCase) *TestimonialHandler {
	return &TestimonialHandler{useCase: useCase}
}

func (h *TestimonialHandler) GetPublic(c *fiber.Ctx) error {
	testimonials, err := h.useCase.GetActivePublic(c.Context())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    testimonials,
	})
}

func (h *TestimonialHandler) GetAdmin(c *fiber.Ctx) error {
	testimonials, err := h.useCase.GetAllAdmin(c.Context())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    testimonials,
	})
}

func (h *TestimonialHandler) Create(c *fiber.Ctx) error {
	var input models.Testimonial
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	testimonial, err := h.useCase.Create(c.Context(), input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    testimonial,
	})
}

func (h *TestimonialHandler) Update(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid ID")
	}

	var input models.Testimonial
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	testimonial, err := h.useCase.Update(c.Context(), uint(id), input)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    testimonial,
	})
}

func (h *TestimonialHandler) Delete(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid ID")
	}

	err = h.useCase.Delete(c.Context(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "deleted successfully",
	})
}
