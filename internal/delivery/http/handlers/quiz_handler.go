package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type QuizHandler struct {
	useCase usecase.QuizUseCase
}

type CreateQuizRequest struct {
	Title        string `json:"title" validate:"required,min=3,max=150"`
	PassingScore int    `json:"passing_score" validate:"required,numeric,min=1,max=100"`
	MaxAttempts  int    `json:"max_attempts" validate:"required,numeric,min=1,max=10"`
	Duration     int    `json:"duration" validate:"required,numeric,min=1,max=180"`
}

type AddQuestionsRequest struct {
	Questions []usecase.QuestionInput `json:"questions" validate:"required,min=1,dive"`
}

type SubmitAttemptRequest struct {
	Answers []usecase.QuizSubmissionInput `json:"answers" validate:"required,min=1,dive"`
}

func NewQuizHandler(useCase usecase.QuizUseCase) *QuizHandler {
	return &QuizHandler{useCase: useCase}
}

func (h *QuizHandler) getUserID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *QuizHandler) CreateQuiz(c *fiber.Ctx) error {
	teacherID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	sectionIDParam := c.Params("sectionId")
	sectionID, err := strconv.ParseUint(sectionIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid section ID")
	}

	var req CreateQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	quiz, err := h.useCase.CreateQuiz(c.Context(), teacherID, uint(sectionID), req.Title, req.PassingScore, req.MaxAttempts, req.Duration)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    quiz,
		"message": "quiz created successfully",
	})
}

func (h *QuizHandler) AddQuestions(c *fiber.Ctx) error {
	teacherID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	quizIDParam := c.Params("quizId")
	quizID, err := strconv.ParseUint(quizIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid quiz ID")
	}

	var req AddQuestionsRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	err = h.useCase.AddQuestions(c.Context(), teacherID, uint(quizID), req.Questions)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "quiz questions and answers added successfully",
	})
}

func (h *QuizHandler) GetQuiz(c *fiber.Ctx) error {
	studentID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	quizIDParam := c.Params("quizId")
	quizID, err := strconv.ParseUint(quizIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid quiz ID")
	}

	quiz, err := h.useCase.GetQuizForStudent(c.Context(), studentID, uint(quizID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    quiz,
	})
}

func (h *QuizHandler) SubmitAttempt(c *fiber.Ctx) error {
	studentID, err := h.getUserID(c)
	if err != nil {
		return err
	}

	quizIDParam := c.Params("quizId")
	quizID, err := strconv.ParseUint(quizIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid quiz ID")
	}

	var req SubmitAttemptRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	attempt, err := h.useCase.SubmitAttempt(c.Context(), studentID, uint(quizID), req.Answers)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    attempt,
		"message": "quiz attempt evaluated and saved",
	})
}
