package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
)

// --- MOCK CERTIFICATE REPOSITORY ---

type MockCertificateRepository struct {
	MockCreate                      func(cert *models.Certificate) error
	MockGetByID                     func(id uint) (*models.Certificate, error)
	MockGetByCode                   func(code string) (*models.Certificate, error)
	MockGetByEnrollmentID           func(enrollmentID uint) (*models.Certificate, error)
	MockListCertificatesByStudentID func(studentID uint) ([]models.Certificate, error)
	MockGetCourseQuizzes            func(courseID uint) ([]models.Quiz, error)
	MockGetCourseAssignments        func(courseID uint) ([]models.Assignment, error)
	MockHasPassedQuiz               func(studentID, quizID uint) (bool, error)
	MockHasSubmittedAssignment      func(studentID, assignmentID uint) (bool, error)
}

func (m *MockCertificateRepository) Create(ctx context.Context, c *models.Certificate) error {
	return m.MockCreate(c)
}
func (m *MockCertificateRepository) GetByID(ctx context.Context, id uint) (*models.Certificate, error) {
	return m.MockGetByID(id)
}
func (m *MockCertificateRepository) GetByCode(ctx context.Context, code string) (*models.Certificate, error) {
	return m.MockGetByCode(code)
}
func (m *MockCertificateRepository) GetByEnrollmentID(ctx context.Context, id uint) (*models.Certificate, error) {
	return m.MockGetByEnrollmentID(id)
}
func (m *MockCertificateRepository) ListCertificatesByStudentID(ctx context.Context, id uint) ([]models.Certificate, error) {
	return m.MockListCertificatesByStudentID(id)
}
func (m *MockCertificateRepository) GetCourseQuizzes(ctx context.Context, c uint) ([]models.Quiz, error) {
	return m.MockGetCourseQuizzes(c)
}
func (m *MockCertificateRepository) GetCourseAssignments(ctx context.Context, c uint) ([]models.Assignment, error) {
	return m.MockGetCourseAssignments(c)
}
func (m *MockCertificateRepository) HasPassedQuiz(ctx context.Context, s, q uint) (bool, error) {
	return m.MockHasPassedQuiz(s, q)
}
func (m *MockCertificateRepository) HasSubmittedAssignment(ctx context.Context, s, a uint) (bool, error) {
	return m.MockHasSubmittedAssignment(s, a)
}

// --- TEST CASES ---

func TestCertificateUseCase_GenerateCertificate_NotEligible_Progress(t *testing.T) {
	certRepo := &MockCertificateRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	storageClient := &MockStorageClient{}
	notificationUC := &MockNotificationUseCase{}
	cfg := &config.Config{}

	// Enrollment progress percentage is only 50%
	enrollmentRepo.MockGetByStudentAndCourse = func(s, c uint) (*models.Enrollment, error) {
		return &models.Enrollment{ID: 1, StudentID: s, CourseID: c, ProgressPercentage: 50}, nil
	}

	enrollmentRepo.MockGetByID = func(id uint) (*models.Enrollment, error) {
		return &models.Enrollment{ID: id, ProgressPercentage: 50}, nil
	}

	uc := NewCertificateUseCase(certRepo, enrollmentRepo, storageClient, notificationUC, &MockEmailService{}, cfg)
	_, err := uc.GenerateCertificate(context.Background(), 9, 100)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "progress is not complete")
}

func TestCertificateUseCase_VerifyCertificate_Success(t *testing.T) {
	certRepo := &MockCertificateRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	storageClient := &MockStorageClient{}
	notificationUC := &MockNotificationUseCase{}
	cfg := &config.Config{}

	certRepo.MockGetByCode = func(code string) (*models.Certificate, error) {
		return &models.Certificate{
			ID:              1,
			CertificateCode: code,
			IssuedAt:        time.Now(),
		}, nil
	}

	uc := NewCertificateUseCase(certRepo, enrollmentRepo, storageClient, notificationUC, &MockEmailService{}, cfg)
	cert, err := uc.VerifyCertificate(context.Background(), "LMS-CERT-9-100-HEX")

	assert.NoError(t, err)
	assert.NotNil(t, cert)
	assert.Equal(t, "LMS-CERT-9-100-HEX", cert.CertificateCode)
}
