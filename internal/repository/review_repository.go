package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type ReviewRepository interface {
	CreateReview(ctx context.Context, review *models.Review) error
	GetReviewByID(ctx context.Context, id uint) (*models.Review, error)
	GetReviewByStudentAndCourse(ctx context.Context, studentID, courseID uint) (*models.Review, error)
	ListReviewsByCourseID(ctx context.Context, courseID uint, includeHidden bool) ([]models.Review, error)
	UpdateReview(ctx context.Context, review *models.Review) error
	DeleteReview(ctx context.Context, id uint) error
	GetCourseRatingStats(ctx context.Context, courseID uint) (map[int]int64, int64, float64, error)
	ListAllReviews(ctx context.Context, page, limit int, search string) ([]models.Review, int64, error)
}

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) CreateReview(ctx context.Context, review *models.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}

func (r *reviewRepository) GetReviewByID(ctx context.Context, id uint) (*models.Review, error) {
	var review models.Review
	err := r.db.WithContext(ctx).Preload("Student").First(&review, id).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) GetReviewByStudentAndCourse(ctx context.Context, studentID, courseID uint) (*models.Review, error) {
	var review models.Review
	err := r.db.WithContext(ctx).Preload("Student").
		Where("student_id = ? AND course_id = ?", studentID, courseID).
		First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) ListReviewsByCourseID(ctx context.Context, courseID uint, includeHidden bool) ([]models.Review, error) {
	var reviews []models.Review
	query := r.db.WithContext(ctx).Preload("Student").Where("course_id = ?", courseID)
	if !includeHidden {
		query = query.Where("is_hidden = 0")
	}
	err := query.Order("created_at desc").Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) UpdateReview(ctx context.Context, review *models.Review) error {
	return r.db.WithContext(ctx).Save(review).Error
}

func (r *reviewRepository) DeleteReview(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Review{}, id).Error
}

func (r *reviewRepository) GetCourseRatingStats(ctx context.Context, courseID uint) (map[int]int64, int64, float64, error) {
	type RatingGroup struct {
		Rating int
		Count  int64
	}
	var groups []RatingGroup

	err := r.db.WithContext(ctx).Model(&models.Review{}).
		Select("rating, count(*) as count").
		Where("course_id = ? AND is_hidden = 0", courseID).
		Group("rating").
		Scan(&groups).Error
	if err != nil {
		return nil, 0, 0, err
	}

	counts := map[int]int64{1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
	var totalCount int64
	var sumRating float64

	for _, g := range groups {
		if g.Rating >= 1 && g.Rating <= 5 {
			counts[g.Rating] = g.Count
			totalCount += g.Count
			sumRating += float64(g.Rating * int(g.Count))
		}
	}

	var avg float64
	if totalCount > 0 {
		avg = sumRating / float64(totalCount)
	}

	return counts, totalCount, avg, nil
}

func (r *reviewRepository) ListAllReviews(ctx context.Context, page, limit int, search string) ([]models.Review, int64, error) {
	var reviews []models.Review
	var count int64

	query := r.db.WithContext(ctx).Model(&models.Review{}).Preload("Student").Preload("Course")

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("comment LIKE ?", searchPattern)
	}

	err := query.Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = query.Order("created_at desc").Offset(offset).Limit(limit).Find(&reviews).Error
	if err != nil {
		return nil, 0, err
	}

	return reviews, count, nil
}
