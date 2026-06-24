package usecase

import (
	"context"
	"io"
	"testing"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
)

// --- MOCK ASSIGNMENT REPOSITORY ---

type MockAssignmentRepository struct {
	MockCreateAssignment            func(assignment *models.Assignment) error
	MockGetByID                     func(id uint) (*models.Assignment, error)
	MockGetBySectionID              func(sectionID uint) ([]models.Assignment, error)
	MockCreateSubmission            func(submission *models.Submission) error
	MockUpdateSubmission            func(submission *models.Submission) error
	MockGetSubmissionByID           func(id uint) (*models.Submission, error)
	MockGetSubmissionByStudent      func(studentID, assignmentID uint) (*models.Submission, error)
	MockListSubmissionsByAssignment func(assignmentID uint) ([]models.Submission, error)
}

func (m *MockAssignmentRepository) CreateAssignment(ctx context.Context, a *models.Assignment) error {
	return m.MockCreateAssignment(a)
}
func (m *MockAssignmentRepository) GetByID(ctx context.Context, id uint) (*models.Assignment, error) {
	return m.MockGetByID(id)
}
func (m *MockAssignmentRepository) GetBySectionID(ctx context.Context, s uint) ([]models.Assignment, error) {
	return m.MockGetBySectionID(s)
}
func (m *MockAssignmentRepository) CreateSubmission(ctx context.Context, s *models.Submission) error {
	return m.MockCreateSubmission(s)
}
func (m *MockAssignmentRepository) UpdateSubmission(ctx context.Context, s *models.Submission) error {
	return m.MockUpdateSubmission(s)
}
func (m *MockAssignmentRepository) GetSubmissionByID(ctx context.Context, id uint) (*models.Submission, error) {
	return m.MockGetSubmissionByID(id)
}
func (m *MockAssignmentRepository) GetSubmissionByStudent(ctx context.Context, s, a uint) (*models.Submission, error) {
	return m.MockGetSubmissionByStudent(s, a)
}
func (m *MockAssignmentRepository) ListSubmissionsByAssignment(ctx context.Context, a uint) ([]models.Submission, error) {
	return m.MockListSubmissionsByAssignment(a)
}
func (m *MockAssignmentRepository) GradeOverdueAssignmentsToZero(ctx context.Context) error {
	return nil
}

// --- MOCK STORAGE CLIENT ---

type MockStorageClient struct {
	MockUploadFile                 func(ctx context.Context, file io.Reader, filename, folder string) (string, error)
	MockDeleteFile                 func(ctx context.Context, publicID string) error
	MockGeneratePresignedSignature func(ctx context.Context, folder string) (map[string]interface{}, error)
}

func (m *MockStorageClient) UploadFile(ctx context.Context, file io.Reader, f, fd string) (string, error) {
	return m.MockUploadFile(ctx, file, f, fd)
}
func (m *MockStorageClient) DeleteFile(ctx context.Context, p string) error {
	return m.MockDeleteFile(ctx, p)
}
func (m *MockStorageClient) GeneratePresignedSignature(ctx context.Context, folder string) (map[string]interface{}, error) {
	return m.MockGeneratePresignedSignature(ctx, folder)
}

// --- TEST CASES ---

func TestAssignmentUseCase_CreateAssignment_Success(t *testing.T) {
	assignmentRepo := &MockAssignmentRepository{}
	sectionRepo := &MockSectionRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	storageClient := &MockStorageClient{}
	notificationUC := &MockNotificationUseCase{}

	sectionRepo.MockGetByID = func(id uint) (*models.Section, error) {
		return &models.Section{ID: id, CourseID: 100}, nil
	}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{ID: id, TeacherID: 10}, nil
	}

	var savedAssignment *models.Assignment
	assignmentRepo.MockCreateAssignment = func(a *models.Assignment) error {
		savedAssignment = a
		return nil
	}

	uc := NewAssignmentUseCase(assignmentRepo, sectionRepo, courseRepo, enrollmentRepo, storageClient, notificationUC, &MockEmailService{}, &MockAuditLogUseCase{})
	dueDate := time.Now().Add(24 * time.Hour)
	assignment, err := uc.CreateAssignment(context.Background(), 10, 1, "Essay 1", "Write Golang specs", 10, dueDate)

	assert.NoError(t, err)
	assert.NotNil(t, assignment)
	assert.Equal(t, "Essay 1", assignment.Title)
	assert.Equal(t, savedAssignment, assignment)
}

func TestAssignmentUseCase_GradeSubmission_Success(t *testing.T) {
	assignmentRepo := &MockAssignmentRepository{}
	sectionRepo := &MockSectionRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	storageClient := &MockStorageClient{}
	notificationUC := &MockNotificationUseCase{}

	assignmentRepo.MockGetSubmissionByID = func(id uint) (*models.Submission, error) {
		return &models.Submission{
			ID:           id,
			AssignmentID: 1,
			StudentID:    99,
		}, nil
	}

	assignmentRepo.MockGetByID = func(id uint) (*models.Assignment, error) {
		return &models.Assignment{
			ID:        id,
			SectionID: 5,
			MaxScore:  10,
			Title:     "Homework 1",
		}, nil
	}

	sectionRepo.MockGetByID = func(id uint) (*models.Section, error) {
		return &models.Section{ID: id, CourseID: 100}, nil
	}

	courseRepo.MockGetByID = func(id uint) (*models.Course, error) {
		return &models.Course{ID: id, TeacherID: 10}, nil
	}

	assignmentRepo.MockUpdateSubmission = func(s *models.Submission) error {
		assert.Equal(t, 8, *s.Score)
		assert.Equal(t, "Good work!", s.Feedback)
		return nil
	}

	notificationUC.MockSendNotification = func(ctx context.Context, u uint, title, msg string) error {
		assert.Equal(t, uint(99), u)
		assert.Contains(t, title, "chấm điểm")
		return nil
	}

	uc := NewAssignmentUseCase(assignmentRepo, sectionRepo, courseRepo, enrollmentRepo, storageClient, notificationUC, &MockEmailService{}, &MockAuditLogUseCase{})
	submission, err := uc.GradeSubmission(context.Background(), 10, 1001, 8, "Good work!")

	assert.NoError(t, err)
	assert.NotNil(t, submission)
	assert.Equal(t, 8, *submission.Score)
}
