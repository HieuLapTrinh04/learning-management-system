package usecase

import (
	"context"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// --- TEST CASES ---

func TestEnrollmentUseCase_EnrollCourse_Success(t *testing.T) {
	enrollmentRepo := &MockEnrollmentRepository{}
	courseRepo := &MockCourseRepository{}
	lessonRepo := &MockLessonRepository{}
	sectionRepo := &MockSectionRepository{}
	notificationUC := &MockNotificationUseCase{}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{
			ID:     id,
			Title:  "Golang for Beginners",
			Status: "published",
			Price:  0.0,
		}, nil
	}

	enrollmentRepo.MockGetByStudentAndCourse = func(studentID, courseID uint) (*models.Enrollment, error) {
		return nil, gorm.ErrRecordNotFound // Not enrolled yet
	}

	var savedEnrollment *models.Enrollment
	enrollmentRepo.MockCreate = func(e *models.Enrollment) error {
		savedEnrollment = e
		return nil
	}

	notificationUC.MockSendNotification = func(ctx context.Context, u uint, title, msg string) error {
		assert.Equal(t, uint(9), u)
		assert.Contains(t, title, "thành công")
		return nil
	}

	uc := NewEnrollmentUseCase(enrollmentRepo, courseRepo, lessonRepo, sectionRepo, notificationUC)
	enrollment, err := uc.EnrollCourse(context.Background(), 9, 100)

	assert.NoError(t, err)
	assert.NotNil(t, enrollment)
	assert.Equal(t, uint(9), enrollment.StudentID)
	assert.Equal(t, uint(100), enrollment.CourseID)
	assert.Equal(t, savedEnrollment, enrollment)
}

func TestEnrollmentUseCase_EnrollCourse_NotPublished(t *testing.T) {
	enrollmentRepo := &MockEnrollmentRepository{}
	courseRepo := &MockCourseRepository{}
	lessonRepo := &MockLessonRepository{}
	sectionRepo := &MockSectionRepository{}
	notificationUC := &MockNotificationUseCase{}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{
			ID:     id,
			Status: "draft",
		}, nil
	}

	uc := NewEnrollmentUseCase(enrollmentRepo, courseRepo, lessonRepo, sectionRepo, notificationUC)
	_, err := uc.EnrollCourse(context.Background(), 9, 100)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "course is not published")
}

func TestEnrollmentUseCase_CompleteLesson_Success(t *testing.T) {
	enrollmentRepo := &MockEnrollmentRepository{}
	courseRepo := &MockCourseRepository{}
	lessonRepo := &MockLessonRepository{}
	sectionRepo := &MockSectionRepository{}
	notificationUC := &MockNotificationUseCase{}

	lessonRepo.MockGetByID = func(id uint) (*models.Lesson, error) {
		return &models.Lesson{ID: id, SectionID: 10}, nil
	}

	sectionRepo.MockGetByID = func(id uint) (*models.Section, error) {
		return &models.Section{ID: id, CourseID: 100}, nil
	}

	enrollmentRepo.MockGetByStudentAndCourse = func(s, c uint) (*models.Enrollment, error) {
		return &models.Enrollment{ID: 1, StudentID: s, CourseID: c}, nil
	}

	enrollmentRepo.MockGetLessonProgress = func(e, l uint) (*models.LessonProgress, error) {
		return nil, gorm.ErrRecordNotFound // Not completed yet
	}

	enrollmentRepo.MockCreateLessonProgress = func(p *models.LessonProgress) error {
		assert.Equal(t, uint(1), p.EnrollmentID)
		return nil
	}

	// 2 lessons total in this course
	enrollmentRepo.MockCountLessonsInCourse = func(c uint) (int64, error) {
		return 2, nil
	}

	// 1 lesson completed (this one)
	enrollmentRepo.MockCountCompletedLessons = func(e uint) (int64, error) {
		return 1, nil
	}

	enrollmentRepo.MockUpdate = func(e *models.Enrollment) error {
		assert.Equal(t, 50, e.ProgressPercentage) // 1/2 = 50%
		return nil
	}

	uc := NewEnrollmentUseCase(enrollmentRepo, courseRepo, lessonRepo, sectionRepo, notificationUC)
	progressPercent, err := uc.CompleteLesson(context.Background(), 9, 5)

	assert.NoError(t, err)
	assert.Equal(t, 50, progressPercent)
}
