package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// --- MOCK COURSE USECASE ---

type MockCourseUseCase struct {
	MockCreateCourse      func(ctx context.Context, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error)
	MockUpdateCourse      func(ctx context.Context, id, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error)
	MockDeleteCourse      func(ctx context.Context, id, teacherID uint) error
	MockPublishCourse     func(ctx context.Context, id, teacherID uint, status string) error
	MockAddSection        func(ctx context.Context, teacherID, courseID uint, title string, order int) (*models.Section, error)
	MockUpdateSection     func(ctx context.Context, teacherID, sectionID uint, title string, order int) (*models.Section, error)
	MockDeleteSection     func(ctx context.Context, teacherID, sectionID uint) error
	MockAddLesson         func(ctx context.Context, teacherID, sectionID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error)
	MockUpdateLesson      func(ctx context.Context, teacherID, lessonID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error)
	MockDeleteLesson      func(ctx context.Context, teacherID, lessonID uint) error
	MockGetCourseDetails  func(ctx context.Context, idOrSlug string) (*models.Course, error)
	MockSearchCourses     func(ctx context.Context, categorySlug, searchKeyword, priceType string, page, limit int) ([]models.Course, int64, error)
	MockGetTeacherCourses func(ctx context.Context, teacherID uint) ([]models.Course, error)
}

func (m *MockCourseUseCase) CreateCourse(ctx context.Context, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error) {
	return m.MockCreateCourse(ctx, teacherID, title, subtitle, description, price, categoryID, thumbnailURL)
}
func (m *MockCourseUseCase) UpdateCourse(ctx context.Context, id, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error) {
	return m.MockUpdateCourse(ctx, id, teacherID, title, subtitle, description, price, categoryID, thumbnailURL)
}
func (m *MockCourseUseCase) DeleteCourse(ctx context.Context, id, teacherID uint) error {
	return m.MockDeleteCourse(ctx, id, teacherID)
}
func (m *MockCourseUseCase) PublishCourse(ctx context.Context, id, teacherID uint, status string) error {
	return m.MockPublishCourse(ctx, id, teacherID, status)
}
func (m *MockCourseUseCase) AddSection(ctx context.Context, teacherID, courseID uint, title string, order int) (*models.Section, error) {
	return m.MockAddSection(ctx, teacherID, courseID, title, order)
}
func (m *MockCourseUseCase) UpdateSection(ctx context.Context, teacherID, sectionID uint, title string, order int) (*models.Section, error) {
	return m.MockUpdateSection(ctx, teacherID, sectionID, title, order)
}
func (m *MockCourseUseCase) DeleteSection(ctx context.Context, teacherID, sectionID uint) error {
	return m.MockDeleteSection(ctx, teacherID, sectionID)
}
func (m *MockCourseUseCase) AddLesson(ctx context.Context, teacherID, sectionID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error) {
	return m.MockAddLesson(ctx, teacherID, sectionID, title, lessonType, content, videoURL, documentURL, duration, order)
}
func (m *MockCourseUseCase) UpdateLesson(ctx context.Context, teacherID, lessonID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error) {
	return m.MockUpdateLesson(ctx, teacherID, lessonID, title, lessonType, content, videoURL, documentURL, duration, order)
}
func (m *MockCourseUseCase) DeleteLesson(ctx context.Context, teacherID, lessonID uint) error {
	return m.MockDeleteLesson(ctx, teacherID, lessonID)
}
func (m *MockCourseUseCase) GetCourseDetails(ctx context.Context, idOrSlug string) (*models.Course, error) {
	return m.MockGetCourseDetails(ctx, idOrSlug)
}
func (m *MockCourseUseCase) SearchCourses(ctx context.Context, categorySlug, searchKeyword, priceType string, page, limit int) ([]models.Course, int64, error) {
	return m.MockSearchCourses(ctx, categorySlug, searchKeyword, priceType, page, limit)
}
func (m *MockCourseUseCase) GetTeacherCourses(ctx context.Context, teacherID uint) ([]models.Course, error) {
	return m.MockGetTeacherCourses(ctx, teacherID)
}

// --- TEST CASES ---

func TestCourseHandler_CreateCourse_Success(t *testing.T) {
	mockUC := &MockCourseUseCase{}
	mockUC.MockCreateCourse = func(ctx context.Context, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error) {
		assert.Equal(t, uint(10), teacherID)
		assert.Equal(t, "Introduction to Golang", title)
		return &models.Course{ID: 1, Title: title}, nil
	}

	app := fiber.New()
	handler := NewCourseHandler(mockUC, nil)

	// Inject teacherID context
	injectTeacherContext := func(c *fiber.Ctx) error {
		c.Locals("user_id", uint(10))
		return c.Next()
	}

	app.Post("/api/v1/teacher/courses", injectTeacherContext, handler.CreateCourse)

	reqBody := `{"title": "Introduction to Golang", "subtitle": "Basics of Go", "description": "Course content", "price": 0.0, "category_id": 2, "thumbnail_url": ""}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/teacher/courses", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var body map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&body)
	assert.True(t, body["success"].(bool))
}
