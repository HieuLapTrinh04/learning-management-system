package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"gorm.io/gorm"
)

type AnswerInput struct {
	AnswerText string `json:"answer_text" validate:"required"`
	IsCorrect  bool   `json:"is_correct"`
}

type QuestionInput struct {
	QuestionText string        `json:"question_text" validate:"required"`
	Type         string        `json:"type" validate:"required,oneof=single multiple"`
	Answers      []AnswerInput `json:"answers" validate:"required,min=2"`
}

type QuizSubmissionInput struct {
	QuestionID        uint   `json:"question_id"`
	SelectedAnswerIDs []uint `json:"selected_answer_ids"`
}

type QuizUseCase interface {
	CreateQuiz(ctx context.Context, teacherID, sectionID uint, title string, passingScore, maxAttempts, duration int) (*models.Quiz, error)
	AddQuestions(ctx context.Context, teacherID, quizID uint, inputs []QuestionInput) error
	GetQuizForStudent(ctx context.Context, studentID, quizID uint) (*models.Quiz, error)
	SubmitAttempt(ctx context.Context, studentID, quizID uint, submissions []QuizSubmissionInput) (*models.QuizAttempt, error)
	SetAutoCertifier(fn func(studentID, courseID uint))
}

type quizUseCase struct {
	quizRepo            repository.QuizRepository
	sectionRepo         repository.SectionRepository
	courseRepo          repository.CourseRepository
	enrollmentRepo      repository.EnrollmentRepository
	notificationUseCase NotificationUseCase
	autoCertifier       func(studentID, courseID uint)
}

func NewQuizUseCase(
	quizRepo repository.QuizRepository,
	sectionRepo repository.SectionRepository,
	courseRepo repository.CourseRepository,
	enrollmentRepo repository.EnrollmentRepository,
	notificationUseCase NotificationUseCase,
) QuizUseCase {
	return &quizUseCase{
		quizRepo:            quizRepo,
		sectionRepo:         sectionRepo,
		courseRepo:          courseRepo,
		enrollmentRepo:      enrollmentRepo,
		notificationUseCase: notificationUseCase,
	}
}

func (u *quizUseCase) SetAutoCertifier(fn func(studentID, courseID uint)) {
	u.autoCertifier = fn
}

func (u *quizUseCase) CreateQuiz(ctx context.Context, teacherID, sectionID uint, title string, passingScore, maxAttempts, duration int) (*models.Quiz, error) {
	section, err := u.sectionRepo.GetByID(ctx, sectionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "section not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	quiz := &models.Quiz{
		SectionID:    sectionID,
		Title:        title,
		PassingScore: passingScore,
		MaxAttempts:  maxAttempts,
		Duration:     duration,
	}

	err = u.quizRepo.CreateQuiz(ctx, quiz)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create quiz", err)
	}

	return quiz, nil
}

func (u *quizUseCase) AddQuestions(ctx context.Context, teacherID, quizID uint, inputs []QuestionInput) error {
	quiz, err := u.quizRepo.GetByID(ctx, quizID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "quiz not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, quiz.SectionID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to identify quiz section", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to identify course owner", err)
	}

	if course.TeacherID != teacherID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	// Insert questions and answers
	for _, qi := range inputs {
		q := &models.Question{
			QuizID:       quizID,
			QuestionText: qi.QuestionText,
			Type:         qi.Type,
		}
		err = u.quizRepo.CreateQuestion(ctx, q)
		if err != nil {
			return apperrors.NewAppError(apperrors.TypeInternal, "failed to create quiz question", err)
		}

		var answers []models.Answer
		for _, ai := range qi.Answers {
			answers = append(answers, models.Answer{
				QuestionID: q.ID,
				AnswerText: ai.AnswerText,
				IsCorrect:  ai.IsCorrect,
			})
		}
		err = u.quizRepo.CreateAnswers(ctx, answers)
		if err != nil {
			return apperrors.NewAppError(apperrors.TypeInternal, "failed to create answer choices", err)
		}
	}

	return nil
}

func (u *quizUseCase) GetQuizForStudent(ctx context.Context, studentID, quizID uint) (*models.Quiz, error) {
	quiz, err := u.quizRepo.GetByID(ctx, quizID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "quiz not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, quiz.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	// Verify enrollment
	_, err = u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, section.CourseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you are not enrolled in this course", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify enrollment", err)
	}

	// Fetch attempts
	attempts, err := u.quizRepo.GetAttemptsByStudent(ctx, studentID, quizID)
	if err == nil && attempts != nil {
		quiz.Attempts = attempts
	}

	return quiz, nil
}

func (u *quizUseCase) SubmitAttempt(ctx context.Context, studentID, quizID uint, submissions []QuizSubmissionInput) (*models.QuizAttempt, error) {
	// 1. Fetch quiz with correct answers
	quiz, err := u.quizRepo.GetByIDWithCorrectAnswers(ctx, quizID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "quiz not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, quiz.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	// 2. Verify student is enrolled in course
	_, err = u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, section.CourseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you are not enrolled in this course", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to check enrollment status", err)
	}

	// 3. Enforce MaxAttempts limits
	attemptsCount, err := u.quizRepo.CountAttempts(ctx, studentID, quizID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to retrieve attempt counts", err)
	}

	if attemptsCount >= int64(quiz.MaxAttempts) {
		return nil, apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("access denied: you have exceeded the maximum of %d attempts allowed", quiz.MaxAttempts), nil)
	}

	// 4. Auto-Grading & Result Calculation
	totalQuestions := len(quiz.Questions)
	if totalQuestions == 0 {
		return nil, apperrors.NewAppError(apperrors.TypeConflict, "quiz does not contain any questions", nil)
	}

	correctQuestions := 0

	// Map submissions by question ID for efficient lookup
	submissionMap := make(map[uint][]uint)
	for _, sub := range submissions {
		submissionMap[sub.QuestionID] = sub.SelectedAnswerIDs
	}

	for _, q := range quiz.Questions {
		selectedIDs := submissionMap[q.ID]

		// Find correct answer IDs from database GORM structures
		var correctIDs []uint
		for _, ans := range q.Answers {
			if ans.IsCorrect {
				correctIDs = append(correctIDs, ans.ID)
			}
		}

		// Check if selections match correct answers
		if len(selectedIDs) == len(correctIDs) && len(correctIDs) > 0 {
			matchCount := 0
			correctMap := make(map[uint]bool)
			for _, cid := range correctIDs {
				correctMap[cid] = true
			}
			for _, sid := range selectedIDs {
				if correctMap[sid] {
					matchCount++
				}
			}
			if matchCount == len(correctIDs) {
				correctQuestions++
			}
		}
	}

	score := int((correctQuestions * 100) / totalQuestions)
	isPassed := score >= quiz.PassingScore

	// 5. Create attempt record
	attempt := &models.QuizAttempt{
		StudentID:   studentID,
		QuizID:      quizID,
		Score:       score,
		IsPassed:    isPassed,
		AttemptedAt: time.Now(),
	}

	err = u.quizRepo.CreateAttempt(ctx, attempt)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to save quiz attempt result", err)
	}

	// Trigger quiz completed notification
	statusStr := "Không đạt"
	if isPassed {
		statusStr = "Đạt"
	}
	notificationTitle := "Kiểm tra hoàn thành"
	notificationMsg := fmt.Sprintf("Bạn đã hoàn thành bài kiểm tra '%s' với điểm số %d%% (Điểm đạt: %d%%) - Kết quả: %s", quiz.Title, score, quiz.PassingScore, statusStr)
	_ = u.notificationUseCase.SendNotification(ctx, studentID, notificationTitle, notificationMsg)

	// Trigger auto-certificate if passed
	if isPassed && u.autoCertifier != nil {
		u.autoCertifier(studentID, section.CourseID)
	}

	return attempt, nil
}
