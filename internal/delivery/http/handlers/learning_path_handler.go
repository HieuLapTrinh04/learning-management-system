package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type LearningPathHandler struct {
	pathUseCase usecase.LearningPathUseCase
}

func NewLearningPathHandler(pathUseCase usecase.LearningPathUseCase) *LearningPathHandler {
	return &LearningPathHandler{pathUseCase: pathUseCase}
}

func (h *LearningPathHandler) ListAll(c *fiber.Ctx) error {
	paths, err := h.pathUseCase.ListAll(c.UserContext())
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    paths,
	})
}

func (h *LearningPathHandler) GetByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid learning path ID")
	}

	path, err := h.pathUseCase.GetByID(c.UserContext(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    path,
	})
}

func (h *LearningPathHandler) Create(c *fiber.Ctx) error {
	var req struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		ThumbnailURL string `json:"thumbnail_url"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	path := &models.LearningPath{
		Title:        req.Title,
		Description:  req.Description,
		ThumbnailURL: req.ThumbnailURL,
	}

	if err := h.pathUseCase.Create(c.UserContext(), path); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    path,
	})
}

func (h *LearningPathHandler) Update(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid learning path ID")
	}

	var req struct {
		Title        string `json:"title"`
		Description  string `json:"description"`
		ThumbnailURL string `json:"thumbnail_url"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	path := &models.LearningPath{
		ID:           uint(id),
		Title:        req.Title,
		Description:  req.Description,
		ThumbnailURL: req.ThumbnailURL,
	}

	if err := h.pathUseCase.Update(c.UserContext(), path); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Learning path updated successfully",
	})
}

func (h *LearningPathHandler) Delete(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid learning path ID")
	}

	if err := h.pathUseCase.Delete(c.UserContext(), uint(id)); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Learning path deleted successfully",
	})
}

func (h *LearningPathHandler) AddCourse(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid learning path ID")
	}

	var req struct {
		CourseID      uint `json:"course_id"`
		SequenceOrder int  `json:"sequence_order"`
	}
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := h.pathUseCase.AddCourseToPath(c.UserContext(), uint(id), req.CourseID, req.SequenceOrder); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Course added to learning path successfully",
	})
}

func (h *LearningPathHandler) RemoveCourse(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid learning path ID")
	}
	courseID, err := c.ParamsInt("courseId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	if err := h.pathUseCase.RemoveCourseFromPath(c.UserContext(), uint(id), uint(courseID)); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Course removed from learning path successfully",
	})
}
