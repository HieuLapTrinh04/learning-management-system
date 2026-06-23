package usecase

import (
	"context"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// --- MOCK REPOSITORIES ---

type MockLessonRepository struct {
	MockCreate            func(lesson *models.Lesson) error
	MockUpdate            func(lesson *models.Lesson) error
	MockDelete            func(id uint) error
	MockGetByID           func(id uint) (*models.Lesson, error)
	MockGetBySectionAndID func(sectionID uint, id uint) (*models.Lesson, error)
}

func (m *MockLessonRepository) Create(ctx context.Context, l *models.Lesson) error {
	return m.MockCreate(l)
}
func (m *MockLessonRepository) Update(ctx context.Context, l *models.Lesson) error {
	return m.MockUpdate(l)
}
func (m *MockLessonRepository) Delete(ctx context.Context, id uint) error { return m.MockDelete(id) }
func (m *MockLessonRepository) GetByID(ctx context.Context, id uint) (*models.Lesson, error) {
	return m.MockGetByID(id)
}
func (m *MockLessonRepository) GetBySectionAndID(ctx context.Context, sectionID, id uint) (*models.Lesson, error) {
	if m.MockGetBySectionAndID != nil {
		return m.MockGetBySectionAndID(sectionID, id)
	}
	return nil, nil
}

// --- TEST CASES ---

func TestCourseUseCase_CreateCourse_Success(t *testing.T) {
	courseRepo := &MockCourseRepository{}
	sectionRepo := &MockSectionRepository{}
	lessonRepo := &MockLessonRepository{}

	courseRepo.MockGetBySlug = func(slug string) (*models.Course, error) {
		return nil, gorm.ErrRecordNotFound
	}

	courseRepo.MockCreate = func(course *models.Course) error {
		assert.Equal(t, "Golang Microservices", course.Title)
		assert.Equal(t, uint(10), course.TeacherID)
		return nil
	}

	uc := NewCourseUseCase(courseRepo, sectionRepo, lessonRepo, &MockAuditLogUseCase{})
	course, err := uc.CreateCourse(context.Background(), 10, "Golang Microservices", "Fiber framework", "Desc", 99.9, 1, "")

	assert.NoError(t, err)
	assert.NotNil(t, course)
	assert.Equal(t, "golang-microservices", course.Slug)
}

func TestCourseUseCase_UpdateCourse_OwnershipDenied(t *testing.T) {
	courseRepo := &MockCourseRepository{}
	sectionRepo := &MockSectionRepository{}
	lessonRepo := &MockLessonRepository{}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{
			ID:        id,
			TeacherID: 10, // Owned by Teacher #10
		}, nil
	}

	uc := NewCourseUseCase(courseRepo, sectionRepo, lessonRepo, &MockAuditLogUseCase{})
	// Try updating using Teacher #20 (mismatch)
	_, err := uc.UpdateCourse(context.Background(), 1, 20, "Title", "Subtitle", "Desc", 49.0, 1, "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "access denied")
}

func TestCourseUseCase_DeleteCourse_Success(t *testing.T) {
	courseRepo := &MockCourseRepository{}
	sectionRepo := &MockSectionRepository{}
	lessonRepo := &MockLessonRepository{}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{
			ID:        id,
			TeacherID: 10,
		}, nil
	}

	courseRepo.MockDelete = func(id uint) error {
		assert.Equal(t, uint(1), id)
		return nil
	}

	uc := NewCourseUseCase(courseRepo, sectionRepo, lessonRepo, &MockAuditLogUseCase{})
	err := uc.DeleteCourse(context.Background(), 1, 10)

	assert.NoError(t, err)
}
