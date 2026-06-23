package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type EnrollmentHandler struct {
	useCase usecase.EnrollmentUseCase
}

func NewEnrollmentHandler(useCase usecase.EnrollmentUseCase) *EnrollmentHandler {
	return &EnrollmentHandler{useCase: useCase}
}

func (h *EnrollmentHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *EnrollmentHandler) EnrollCourse(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDParam := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	enrollment, err := h.useCase.EnrollCourse(c.Context(), studentID, uint(courseID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    enrollment,
		"message": "enrolled course successfully",
	})
}

func (h *EnrollmentHandler) GetMyCourses(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	enrollments, err := h.useCase.GetEnrolledCourses(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    enrollments,
	})
}

func (h *EnrollmentHandler) CompleteLesson(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	lessonIDParam := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(lessonIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid lesson ID")
	}

	progressPercentage, err := h.useCase.CompleteLesson(c.Context(), studentID, uint(lessonID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"progress_percentage": progressPercentage,
		},
		"message": "lesson marked complete successfully",
	})
}

func (h *EnrollmentHandler) GetCourseProgress(c *fiber.Ctx) error {
	teacherID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDParam := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	enrollments, err := h.useCase.GetCourseProgress(c.Context(), teacherID, uint(courseID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    enrollments,
	})
}
