package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK ASSIGNMENT USECASE ---

type MockAssignmentUseCase struct {
	MockCreateAssignment func(ctx context.Context, teacherID, sectionID uint, title, description string, maxScore int, dueDate time.Time) (*models.Assignment, error)
	MockSubmitAssignment func(ctx context.Context, studentID, assignmentID uint, file io.Reader, filename string) (*models.Submission, error)
	MockListSubmissions  func(ctx context.Context, teacherID, assignmentID uint) ([]models.Submission, error)
	MockGradeSubmission  func(ctx context.Context, teacherID, submissionID uint, score int, feedback string) (*models.Submission, error)
}

func (m *MockAssignmentUseCase) CreateAssignment(ctx context.Context, teacherID, sectionID uint, title, description string, maxScore int, dueDate time.Time) (*models.Assignment, error) {
	return m.MockCreateAssignment(ctx, teacherID, sectionID, title, description, maxScore, dueDate)
}
func (m *MockAssignmentUseCase) SubmitAssignment(ctx context.Context, studentID, assignmentID uint, file io.Reader, filename string) (*models.Submission, error) {
	return m.MockSubmitAssignment(ctx, studentID, assignmentID, file, filename)
}
func (m *MockAssignmentUseCase) ListSubmissions(ctx context.Context, teacherID, assignmentID uint) ([]models.Submission, error) {
	return m.MockListSubmissions(ctx, teacherID, assignmentID)
}
func (m *MockAssignmentUseCase) GradeSubmission(ctx context.Context, teacherID, submissionID uint, score int, feedback string) (*models.Submission, error) {
	return m.MockGradeSubmission(ctx, teacherID, submissionID, score, feedback)
}

// --- TEST CASES ---

func TestAssignmentHandler_CreateAssignment_Success(t *testing.T) {
	mockUC := &MockAssignmentUseCase{}
	mockUC.MockCreateAssignment = func(ctx context.Context, teacherID, sectionID uint, title, description string, maxScore int, dueDate time.Time) (*models.Assignment, error) {
		assert.Equal(t, uint(10), teacherID)
		assert.Equal(t, uint(2), sectionID)
		return &models.Assignment{ID: 1, Title: title}, nil
	}

	app := fiber.New()
	handler := NewAssignmentHandler(mockUC)

	injectTeacherContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(10))
		return c.Next()
	}

	app.Post("/api/v1/teacher/sections/:sectionId/assignments", injectTeacherContext, handler.CreateAssignment)

	reqBody := `{"title": "Essay 1", "description": "Write essays", "max_score": 100, "due_date": "2026-06-25T15:30:00Z"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/teacher/sections/2/assignments", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}

func TestAssignmentHandler_GradeSubmission_Success(t *testing.T) {
	mockUC := &MockAssignmentUseCase{}
	mockUC.MockGradeSubmission = func(ctx context.Context, teacherID, submissionID uint, score int, feedback string) (*models.Submission, error) {
		assert.Equal(t, uint(10), teacherID)
		assert.Equal(t, uint(100), submissionID)
		assert.Equal(t, 85, score)
		return &models.Submission{ID: submissionID, Score: &score, Feedback: feedback}, nil
	}

	app := fiber.New()
	handler := NewAssignmentHandler(mockUC)

	injectTeacherContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(10))
		return c.Next()
	}

	app.Put("/api/v1/submissions/:submissionId/grade", injectTeacherContext, handler.GradeSubmission)

	reqBody := `{"score": 85, "feedback": "Good progress!"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/submissions/100/grade", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}
