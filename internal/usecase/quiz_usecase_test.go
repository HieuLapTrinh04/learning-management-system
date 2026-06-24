package usecase

import (
	"context"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/stretchr/testify/assert"
)

// --- MOCK REPOSITORIES ---

type MockQuizRepository struct {
	MockCreateQuiz                func(quiz *models.Quiz) error
	MockCreateQuestion            func(question *models.Question) error
	MockCreateAnswers             func(answers []models.Answer) error
	MockGetByID                   func(id uint) (*models.Quiz, error)
	MockGetByIDWithCorrectAnswers func(id uint) (*models.Quiz, error)
	MockCreateAttempt             func(attempt *models.QuizAttempt) error
	MockCountAttempts             func(studentID, quizID uint) (int64, error)
	MockGetAttemptsByStudent      func(studentID, quizID uint) ([]models.QuizAttempt, error)
}

func (m *MockQuizRepository) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	return m.MockCreateQuiz(quiz)
}
func (m *MockQuizRepository) CreateQuestion(ctx context.Context, q *models.Question) error {
	return m.MockCreateQuestion(q)
}
func (m *MockQuizRepository) CreateAnswers(ctx context.Context, a []models.Answer) error {
	return m.MockCreateAnswers(a)
}
func (m *MockQuizRepository) GetByID(ctx context.Context, id uint) (*models.Quiz, error) {
	return m.MockGetByID(id)
}
func (m *MockQuizRepository) GetByIDWithCorrectAnswers(ctx context.Context, id uint) (*models.Quiz, error) {
	return m.MockGetByIDWithCorrectAnswers(id)
}
func (m *MockQuizRepository) CreateAttempt(ctx context.Context, at *models.QuizAttempt) error {
	return m.MockCreateAttempt(at)
}
func (m *MockQuizRepository) CountAttempts(ctx context.Context, s, q uint) (int64, error) {
	return m.MockCountAttempts(s, q)
}
func (m *MockQuizRepository) GetAttemptsByStudent(ctx context.Context, s, q uint) ([]models.QuizAttempt, error) {
	return m.MockGetAttemptsByStudent(s, q)
}

type MockSectionRepository struct {
	MockCreate           func(section *models.Section) error
	MockUpdate           func(section *models.Section) error
	MockDelete           func(id uint) error
	MockGetByID          func(id uint) (*models.Section, error)
	MockGetByCourseAndID func(courseID uint, id uint) (*models.Section, error)
}

func (m *MockSectionRepository) Create(ctx context.Context, s *models.Section) error {
	return m.MockCreate(s)
}
func (m *MockSectionRepository) Update(ctx context.Context, s *models.Section) error {
	return m.MockUpdate(s)
}
func (m *MockSectionRepository) Delete(ctx context.Context, id uint) error { return m.MockDelete(id) }
func (m *MockSectionRepository) GetByID(ctx context.Context, id uint) (*models.Section, error) {
	return m.MockGetByID(id)
}
func (m *MockSectionRepository) GetByCourseAndID(ctx context.Context, c, id uint) (*models.Section, error) {
	return m.MockGetByCourseAndID(c, id)
}

type MockCourseRepository struct {
	MockCreate         func(course *models.Course) error
	MockUpdate         func(course *models.Course) error
	MockDelete         func(id uint) error
	MockGetByID        func(id uint) (*models.Course, error)
	MockGetBySlug      func(slug string) (*models.Course, error)
	MockGetDetails     func(idOrSlug string) (*models.Course, error)
	MockSearch         func(cat, key, pr string, pg, lim int) ([]models.Course, int64, error)
	MockGetByTeacherID func(teacherID uint) ([]models.Course, error)
}

func (m *MockCourseRepository) Create(ctx context.Context, c *models.Course) error {
	return m.MockCreate(c)
}
func (m *MockCourseRepository) Update(ctx context.Context, c *models.Course) error {
	return m.MockUpdate(c)
}
func (m *MockCourseRepository) Delete(ctx context.Context, id uint) error { return m.MockDelete(id) }
func (m *MockCourseRepository) GetByID(ctx context.Context, id uint) (*models.Course, error) {
	return m.MockGetByID(id)
}
func (m *MockCourseRepository) GetBySlug(ctx context.Context, s string) (*models.Course, error) {
	return m.MockGetBySlug(s)
}
func (m *MockCourseRepository) GetDetails(ctx context.Context, idOrSlug string) (*models.Course, error) {
	return m.MockGetDetails(idOrSlug)
}
func (m *MockCourseRepository) Search(ctx context.Context, c, k, p string, pg, l int) ([]models.Course, int64, error) {
	return m.MockSearch(c, k, p, pg, l)
}
func (m *MockCourseRepository) GetByTeacherID(ctx context.Context, teacherID uint) ([]models.Course, error) {
	if m.MockGetByTeacherID != nil {
		return m.MockGetByTeacherID(teacherID)
	}
	return nil, nil
}
func (m *MockCourseRepository) GetAdminCourses(ctx context.Context, status string) ([]models.Course, error) {
	return nil, nil
}

type MockEnrollmentRepository struct {
	MockCreate                 func(enrollment *models.Enrollment) error
	MockGetByID                func(id uint) (*models.Enrollment, error)
	MockGetByStudentAndCourse  func(studentID, courseID uint) (*models.Enrollment, error)
	MockListByStudent          func(studentID uint) ([]models.Enrollment, error)
	MockUpdate                 func(enrollment *models.Enrollment) error
	MockGetLessonProgress      func(enrollmentID, lessonID uint) (*models.LessonProgress, error)
	MockCreateLessonProgress   func(progress *models.LessonProgress) error
	MockUpdateLessonProgress   func(progress *models.LessonProgress) error
	MockCountLessonsInCourse   func(courseID uint) (int64, error)
	MockCountCompletedLessons  func(enrollmentID uint) (int64, error)
	MockGetEnrollmentsByCourse func(courseID uint) ([]models.Enrollment, error)
}

func (m *MockEnrollmentRepository) Create(ctx context.Context, e *models.Enrollment) error {
	return m.MockCreate(e)
}
func (m *MockEnrollmentRepository) GetByID(ctx context.Context, id uint) (*models.Enrollment, error) {
	return m.MockGetByID(id)
}
func (m *MockEnrollmentRepository) GetByStudentAndCourse(ctx context.Context, s, c uint) (*models.Enrollment, error) {
	return m.MockGetByStudentAndCourse(s, c)
}
func (m *MockEnrollmentRepository) ListByStudent(ctx context.Context, s uint) ([]models.Enrollment, error) {
	return m.MockListByStudent(s)
}
func (m *MockEnrollmentRepository) Update(ctx context.Context, e *models.Enrollment) error {
	return m.MockUpdate(e)
}
func (m *MockEnrollmentRepository) GetLessonProgress(ctx context.Context, e, l uint) (*models.LessonProgress, error) {
	return m.MockGetLessonProgress(e, l)
}
func (m *MockEnrollmentRepository) CreateLessonProgress(ctx context.Context, p *models.LessonProgress) error {
	return m.MockCreateLessonProgress(p)
}
func (m *MockEnrollmentRepository) UpdateLessonProgress(ctx context.Context, p *models.LessonProgress) error {
	return m.MockUpdateLessonProgress(p)
}
func (m *MockEnrollmentRepository) CountLessonsInCourse(ctx context.Context, c uint) (int64, error) {
	return m.MockCountLessonsInCourse(c)
}
func (m *MockEnrollmentRepository) CountCompletedLessons(ctx context.Context, e uint) (int64, error) {
	return m.MockCountCompletedLessons(e)
}
func (m *MockEnrollmentRepository) GetEnrollmentsByCourse(ctx context.Context, c uint) ([]models.Enrollment, error) {
	if m.MockGetEnrollmentsByCourse != nil {
		return m.MockGetEnrollmentsByCourse(c)
	}
	return nil, nil
}

type MockNotificationUseCase struct {
	MockSendNotification func(ctx context.Context, userID uint, title, message string) error
	MockGetNotifications func(ctx context.Context, userID uint) ([]models.Notification, error)
	MockMarkAsRead       func(ctx context.Context, userID, notificationID uint) error
	MockMarkAllAsRead    func(ctx context.Context, userID uint) error
}

func (m *MockNotificationUseCase) SendNotification(ctx context.Context, userID uint, title, message string) error {
	if m.MockSendNotification != nil {
		return m.MockSendNotification(ctx, userID, title, message)
	}
	return nil
}
func (m *MockNotificationUseCase) GetNotifications(ctx context.Context, userID uint) ([]models.Notification, error) {
	return m.MockGetNotifications(ctx, userID)
}
func (m *MockNotificationUseCase) MarkAsRead(ctx context.Context, userID, notificationID uint) error {
	return m.MockMarkAsRead(ctx, userID, notificationID)
}
func (m *MockNotificationUseCase) MarkAllAsRead(ctx context.Context, userID uint) error {
	return m.MockMarkAllAsRead(ctx, userID)
}

// --- TEST CASES ---

func TestSubmitAttempt_Success(t *testing.T) {
	// Setup Mocks
	quizRepo := &MockQuizRepository{}
	sectionRepo := &MockSectionRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	notificationUseCase := &MockNotificationUseCase{}

	usecase := NewQuizUseCase(quizRepo, sectionRepo, courseRepo, enrollmentRepo, notificationUseCase)

	// Mock Quiz data with correct answers
	quizRepo.MockGetByIDWithCorrectAnswers = func(id uint) (*models.Quiz, error) {
		return &models.Quiz{
			ID:           10,
			SectionID:    1,
			MaxAttempts:  3,
			PassingScore: 70,
			Questions: []models.Question{
				{
					ID:     100,
					QuizID: 10,
					Answers: []models.Answer{
						{ID: 1001, QuestionID: 100, AnswerText: "Answer A", IsCorrect: true},
						{ID: 1002, QuestionID: 100, AnswerText: "Answer B", IsCorrect: false},
					},
				},
				{
					ID:     101,
					QuizID: 10,
					Answers: []models.Answer{
						{ID: 1011, QuestionID: 101, AnswerText: "Answer C", IsCorrect: false},
						{ID: 1012, QuestionID: 101, AnswerText: "Answer D", IsCorrect: true},
					},
				},
			},
		}, nil
	}

	sectionRepo.MockGetByID = func(id uint) (*models.Section, error) {
		return &models.Section{ID: 1, CourseID: 100}, nil
	}

	enrollmentRepo.MockGetByStudentAndCourse = func(s, c uint) (*models.Enrollment, error) {
		return &models.Enrollment{StudentID: 99, CourseID: 100}, nil
	}

	quizRepo.MockCountAttempts = func(s, q uint) (int64, error) {
		return 1, nil // 1 attempt, less than max attempts (3)
	}

	var savedAttempt *models.QuizAttempt
	quizRepo.MockCreateAttempt = func(attempt *models.QuizAttempt) error {
		savedAttempt = attempt
		return nil
	}

	// 1. Submit answers: Question 100 -> correct 1001, Question 101 -> correct 1012 (100% correct)
	submissions := []QuizSubmissionInput{
		{QuestionID: 100, SelectedAnswerIDs: []uint{1001}},
		{QuestionID: 101, SelectedAnswerIDs: []uint{1012}},
	}

	attempt, err := usecase.SubmitAttempt(context.Background(), 99, 10, submissions)

	assert.NoError(t, err)
	assert.NotNil(t, attempt)
	assert.Equal(t, 100, attempt.Score)
	assert.True(t, attempt.IsPassed)
	assert.Equal(t, savedAttempt, attempt)

	// 2. Submit answers: Question 100 -> correct 1001, Question 101 -> wrong 1011 (50% correct, failing passing score 70)
	submissions2 := []QuizSubmissionInput{
		{QuestionID: 100, SelectedAnswerIDs: []uint{1001}},
		{QuestionID: 101, SelectedAnswerIDs: []uint{1011}},
	}

	attempt2, err2 := usecase.SubmitAttempt(context.Background(), 99, 10, submissions2)
	assert.NoError(t, err2)
	assert.NotNil(t, attempt2)
	assert.Equal(t, 50, attempt2.Score)
	assert.False(t, attempt2.IsPassed)
}

func TestSubmitAttempt_MaxAttemptsExceeded(t *testing.T) {
	quizRepo := &MockQuizRepository{}
	sectionRepo := &MockSectionRepository{}
	courseRepo := &MockCourseRepository{}
	enrollmentRepo := &MockEnrollmentRepository{}
	notificationUseCase := &MockNotificationUseCase{}

	usecase := NewQuizUseCase(quizRepo, sectionRepo, courseRepo, enrollmentRepo, notificationUseCase)

	quizRepo.MockGetByIDWithCorrectAnswers = func(id uint) (*models.Quiz, error) {
		return &models.Quiz{
			ID:          10,
			SectionID:   1,
			MaxAttempts: 2,
		}, nil
	}

	sectionRepo.MockGetByID = func(id uint) (*models.Section, error) {
		return &models.Section{ID: 1, CourseID: 100}, nil
	}

	enrollmentRepo.MockGetByStudentAndCourse = func(s, c uint) (*models.Enrollment, error) {
		return &models.Enrollment{StudentID: 99, CourseID: 100}, nil
	}

	quizRepo.MockCountAttempts = func(s, q uint) (int64, error) {
		return 2, nil // Already completed 2 attempts. Exceeded.
	}

	submissions := []QuizSubmissionInput{
		{QuestionID: 100, SelectedAnswerIDs: []uint{1001}},
	}

	attempt, err := usecase.SubmitAttempt(context.Background(), 99, 10, submissions)

	assert.Error(t, err)
	assert.Nil(t, attempt)
	assert.Contains(t, err.Error(), "exceeded the maximum")
}
