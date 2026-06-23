package handlers

import (
	"strconv"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type AssignmentHandler struct {
	useCase usecase.AssignmentUseCase
}

type CreateAssignmentRequest struct {
	Title       string `json:"title" validate:"required,min=3,max=150"`
	Description string `json:"description" validate:"required"`
	MaxScore    int    `json:"max_score" validate:"required,numeric,min=1"`
	DueDate     string `json:"due_date" validate:"required"` // Format: RFC3339 e.g. 2026-06-20T15:30:00Z
}

type GradeSubmissionRequest struct {
	Score    int    `json:"score" validate:"numeric,min=0"`
	Feedback string `json:"feedback"`
}

func NewAssignmentHandler(useCase usecase.AssignmentUseCase) *AssignmentHandler {
	return &AssignmentHandler{useCase: useCase}
}

func (h *AssignmentHandler) getUserID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *AssignmentHandler) CreateAssignment(c *fiber.Ctx) error {
	teacherID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	sectionIDParam := c.Params("sectionId")
	sectionID, err := strconv.ParseUint(sectionIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid section ID")
	}

	var req CreateAssignmentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	// Parse Due Date string
	parsedDueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "due_date must follow RFC3339 format e.g. 2026-06-20T15:30:00Z")
	}

	assignment, err := h.useCase.CreateAssignment(c.Context(), teacherID, uint(sectionID), req.Title, req.Description, req.MaxScore, parsedDueDate)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    assignment,
		"message": "assignment created successfully",
	})
}

func (h *AssignmentHandler) SubmitAssignment(c *fiber.Ctx) error {
	studentID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	assignmentIDParam := c.Params("assignmentId")
	assignmentID, err := strconv.ParseUint(assignmentIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid assignment ID")
	}

	// Parse Multipart Form File
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "missing 'file' parameter in multipart form-data")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to open uploaded file")
	}
	defer file.Close()

	// 1. Validate File Size (e.g. Max 20MB)
	if fileHeader.Size > 20*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "Assignment file exceeds the 20MB limit")
	}

	// 2. Validate MIME Type
	contentType := fileHeader.Header.Get("Content-Type")
	validTypes := map[string]bool{
		"application/pdf": true,
		"application/zip": true,
		"image/jpeg":      true,
		"image/png":       true,
	}
	if !validTypes[contentType] {
		return fiber.NewError(fiber.StatusUnsupportedMediaType, "Unsupported file format. Please upload PDF, ZIP, JPG, or PNG")
	}

	submission, err := h.useCase.SubmitAssignment(c.Context(), studentID, uint(assignmentID), file, fileHeader.Filename)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    submission,
		"message": "assignment submitted successfully",
	})
}

func (h *AssignmentHandler) GetMySubmission(c *fiber.Ctx) error {
	studentID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	assignmentIDParam := c.Params("assignmentId")
	assignmentID, err := strconv.ParseUint(assignmentIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid assignment ID")
	}

	submission, err := h.useCase.GetMySubmission(c.Context(), studentID, uint(assignmentID))
	if err != nil {
		return err
	}

	// if submission is nil, it just returns data: null
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    submission,
	})
}

func (h *AssignmentHandler) ListSubmissions(c *fiber.Ctx) error {
	teacherID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	assignmentIDParam := c.Params("assignmentId")
	assignmentID, err := strconv.ParseUint(assignmentIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid assignment ID")
	}

	submissions, err := h.useCase.ListSubmissions(c.Context(), teacherID, uint(assignmentID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    submissions,
	})
}

func (h *AssignmentHandler) GradeSubmission(c *fiber.Ctx) error {
	teacherID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	submissionIDParam := c.Params("submissionId")
	submissionID, err := strconv.ParseUint(submissionIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid submission ID")
	}

	var req GradeSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	submission, err := h.useCase.GradeSubmission(c.Context(), teacherID, uint(submissionID), req.Score, req.Feedback)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    submission,
		"message": "submission graded and feedback added",
	})
}
