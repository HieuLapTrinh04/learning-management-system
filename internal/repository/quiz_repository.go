package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type QuizRepository interface {
	CreateQuiz(ctx context.Context, quiz *models.Quiz) error
	CreateQuestion(ctx context.Context, question *models.Question) error
	CreateAnswers(ctx context.Context, answers []models.Answer) error
	GetByID(ctx context.Context, id uint) (*models.Quiz, error)
	GetByIDWithCorrectAnswers(ctx context.Context, id uint) (*models.Quiz, error)
	CreateAttempt(ctx context.Context, attempt *models.QuizAttempt) error
	CountAttempts(ctx context.Context, studentID, quizID uint) (int64, error)
	GetAttemptsByStudent(ctx context.Context, studentID, quizID uint) ([]models.QuizAttempt, error)
}

type quizRepository struct {
	db *gorm.DB
}

func NewQuizRepository(db *gorm.DB) QuizRepository {
	return &quizRepository{db: db}
}

func (r *quizRepository) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	return r.db.WithContext(ctx).Create(quiz).Error
}

func (r *quizRepository) CreateQuestion(ctx context.Context, question *models.Question) error {
	return r.db.WithContext(ctx).Create(question).Error
}

func (r *quizRepository) CreateAnswers(ctx context.Context, answers []models.Answer) error {
	return r.db.WithContext(ctx).Create(&answers).Error
}

func (r *quizRepository) GetByID(ctx context.Context, id uint) (*models.Quiz, error) {
	var quiz models.Quiz
	// Preload questions and answers, but answers will not expose is_correct automatically in handler because we will handle it
	err := r.db.WithContext(ctx).Preload("Questions").Preload("Questions.Answers").First(&quiz, id).Error
	if err != nil {
		return nil, err
	}
	return &quiz, nil
}

func (r *quizRepository) GetByIDWithCorrectAnswers(ctx context.Context, id uint) (*models.Quiz, error) {
	var quiz models.Quiz
	// Explicitly retrieve correct answer keys
	err := r.db.WithContext(ctx).Preload("Questions", func(db *gorm.DB) *gorm.DB {
		return db
	}).Preload("Questions.Answers").First(&quiz, id).Error
	if err != nil {
		return nil, err
	}
	return &quiz, nil
}

func (r *quizRepository) CreateAttempt(ctx context.Context, attempt *models.QuizAttempt) error {
	return r.db.WithContext(ctx).Create(attempt).Error
}

func (r *quizRepository) CountAttempts(ctx context.Context, studentID, quizID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.QuizAttempt{}).
		Where("student_id = ? AND quiz_id = ?", studentID, quizID).
		Count(&count).Error
	return count, err
}

func (r *quizRepository) GetAttemptsByStudent(ctx context.Context, studentID, quizID uint) ([]models.QuizAttempt, error) {
	var attempts []models.QuizAttempt
	err := r.db.WithContext(ctx).Where("student_id = ? AND quiz_id = ?", studentID, quizID).
		Order("attempted_at desc").
		Find(&attempts).Error
	return attempts, err
}
