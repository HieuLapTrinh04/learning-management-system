package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK QUIZ USECASE ---

type MockQuizUseCase struct {
	MockCreateQuiz        func(ctx context.Context, teacherID, sectionID uint, title string, passingScore, maxAttempts, duration int) (*models.Quiz, error)
	MockAddQuestions      func(ctx context.Context, teacherID, quizID uint, inputs []usecase.QuestionInput) error
	MockGetQuizForStudent func(ctx context.Context, studentID, quizID uint) (*models.Quiz, error)
	MockSubmitAttempt     func(ctx context.Context, studentID, quizID uint, submissions []usecase.QuizSubmissionInput) (*models.QuizAttempt, error)
}

func (m *MockQuizUseCase) CreateQuiz(ctx context.Context, teacherID, sectionID uint, title string, passingScore, maxAttempts, duration int) (*models.Quiz, error) {
	return m.MockCreateQuiz(ctx, teacherID, sectionID, title, passingScore, maxAttempts, duration)
}
func (m *MockQuizUseCase) AddQuestions(ctx context.Context, teacherID, quizID uint, inputs []usecase.QuestionInput) error {
	return m.MockAddQuestions(ctx, teacherID, quizID, inputs)
}
func (m *MockQuizUseCase) GetQuizForStudent(ctx context.Context, studentID, quizID uint) (*models.Quiz, error) {
	return m.MockGetQuizForStudent(ctx, studentID, quizID)
}
func (m *MockQuizUseCase) SubmitAttempt(ctx context.Context, studentID, quizID uint, submissions []usecase.QuizSubmissionInput) (*models.QuizAttempt, error) {
	return m.MockSubmitAttempt(ctx, studentID, quizID, submissions)
}
func (m *MockQuizUseCase) SetAutoCertifier(fn func(studentID, courseID uint)) {
	// no-op for test
}

// --- TEST CASES ---

func TestQuizHandler_CreateQuiz_Success(t *testing.T) {
	mockUC := &MockQuizUseCase{}
	mockUC.MockCreateQuiz = func(ctx context.Context, teacherID, sectionID uint, title string, passingScore, maxAttempts, duration int) (*models.Quiz, error) {
		assert.Equal(t, uint(10), teacherID)
		assert.Equal(t, uint(5), sectionID)
		return &models.Quiz{ID: 1, Title: title}, nil
	}

	app := fiber.New()
	handler := NewQuizHandler(mockUC)

	injectTeacherContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(10))
		return c.Next()
	}

	app.Post("/api/v1/teacher/sections/:sectionId/quizzes", injectTeacherContext, handler.CreateQuiz)

	reqBody := `{"title": "Go Basics Quiz", "passing_score": 80, "max_attempts": 3, "duration": 45}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/teacher/sections/5/quizzes", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}

func TestQuizHandler_SubmitAttempt_Success(t *testing.T) {
	mockUC := &MockQuizUseCase{}
	mockUC.MockSubmitAttempt = func(ctx context.Context, studentID, quizID uint, submissions []usecase.QuizSubmissionInput) (*models.QuizAttempt, error) {
		assert.Equal(t, uint(99), studentID)
		assert.Equal(t, uint(1), quizID)
		return &models.QuizAttempt{ID: 10, Score: 100, IsPassed: true}, nil
	}

	app := fiber.New()
	handler := NewQuizHandler(mockUC)

	injectStudentContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(99))
		return c.Next()
	}

	app.Post("/api/v1/student/quizzes/:quizId/submit", injectStudentContext, handler.SubmitAttempt)

	reqBody := `{"answers": [{"question_id": 1, "selected_answer_ids": [1001]}]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/student/quizzes/1/submit", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}
