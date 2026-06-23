package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"gorm.io/gorm"
)

type ReviewUseCase interface {
	SubmitReview(ctx context.Context, studentID, courseID uint, rating int, comment string) error
	EditReview(ctx context.Context, studentID, courseID uint, rating int, comment string) error
	ReplyToReview(ctx context.Context, teacherID, reviewID uint, replyText string) error
	ModerateReview(ctx context.Context, reviewID uint, isHidden bool) error
	GetReviewsAndStats(ctx context.Context, courseID uint, isAdminOrTeacher bool) ([]models.Review, map[string]interface{}, error)
	ListAllReviews(ctx context.Context, page, limit int, search string) ([]models.Review, int64, error)
}

type reviewUseCase struct {
	reviewRepo     repository.ReviewRepository
	courseRepo     repository.CourseRepository
	enrollmentRepo repository.EnrollmentRepository
}

func NewReviewUseCase(
	reviewRepo repository.ReviewRepository,
	courseRepo repository.CourseRepository,
	enrollmentRepo repository.EnrollmentRepository,
) ReviewUseCase {
	return &reviewUseCase{
		reviewRepo:     reviewRepo,
		courseRepo:     courseRepo,
		enrollmentRepo: enrollmentRepo,
	}
}

func (u *reviewUseCase) SubmitReview(ctx context.Context, studentID, courseID uint, rating int, comment string) error {
	// 1. Verify student is enrolled in this course
	enrollment, err := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err != nil || enrollment == nil {
		return apperrors.NewAppError(apperrors.TypeForbidden, "Bạn phải đăng ký học khóa học này trước khi gửi đánh giá", err)
	}

	// 2. Verify duplicate review
	existing, err := u.reviewRepo.GetReviewByStudentAndCourse(ctx, studentID, courseID)
	if err == nil && existing != nil {
		return apperrors.NewAppError(apperrors.TypeConflict, "Bạn đã gửi đánh giá cho khóa học này rồi. Vui lòng chỉnh sửa đánh giá cũ.", nil)
	}

	// 3. Validate rating stars
	if rating < 1 || rating > 5 {
		return apperrors.NewAppError(apperrors.TypeValidation, "Điểm đánh giá phải nằm trong khoảng từ 1 đến 5 sao", nil)
	}

	review := &models.Review{
		StudentID: studentID,
		CourseID:  courseID,
		Rating:    rating,
		Comment:   comment,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = u.reviewRepo.CreateReview(ctx, review)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi cơ sở dữ liệu khi tạo đánh giá", err)
	}

	return nil
}

func (u *reviewUseCase) EditReview(ctx context.Context, studentID, courseID uint, rating int, comment string) error {
	// 1. Fetch existing review
	review, err := u.reviewRepo.GetReviewByStudentAndCourse(ctx, studentID, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "Bạn chưa từng đánh giá khóa học này", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi cơ sở dữ liệu khi tìm kiếm đánh giá", err)
	}

	// 2. Validate rating stars
	if rating < 1 || rating > 5 {
		return apperrors.NewAppError(apperrors.TypeValidation, "Điểm đánh giá phải nằm trong khoảng từ 1 đến 5 sao", nil)
	}

	review.Rating = rating
	review.Comment = comment
	review.UpdatedAt = time.Now()

	err = u.reviewRepo.UpdateReview(ctx, review)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Không thể cập nhật thông tin đánh giá", err)
	}

	return nil
}

func (u *reviewUseCase) ReplyToReview(ctx context.Context, teacherID, reviewID uint, replyText string) error {
	// 1. Fetch review details
	review, err := u.reviewRepo.GetReviewByID(ctx, reviewID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "Không tìm thấy đánh giá cần trả lời", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi truy vấn cơ sở dữ liệu", err)
	}

	// 2. Fetch course information to check teacher ownership
	course, err := u.courseRepo.GetByID(ctx, review.CourseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Không thể lấy thông tin khóa học tương ứng", err)
	}

	if course.TeacherID != teacherID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "Chỉ giảng viên phụ trách khóa học này mới được phép trả lời đánh giá", nil)
	}

	now := time.Now()
	review.Reply = replyText
	review.RepliedAt = &now
	review.UpdatedAt = now

	err = u.reviewRepo.UpdateReview(ctx, review)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi lưu phản hồi của giảng viên", err)
	}

	return nil
}

func (u *reviewUseCase) ModerateReview(ctx context.Context, reviewID uint, isHidden bool) error {
	// 1. Fetch review
	review, err := u.reviewRepo.GetReviewByID(ctx, reviewID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "Không tìm thấy đánh giá cần kiểm duyệt", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi cơ sở dữ liệu", err)
	}

	review.IsHidden = isHidden
	review.UpdatedAt = time.Now()

	err = u.reviewRepo.UpdateReview(ctx, review)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Lỗi lưu cập nhật kiểm duyệt đánh giá", err)
	}

	return nil
}

func (u *reviewUseCase) GetReviewsAndStats(ctx context.Context, courseID uint, isAdminOrTeacher bool) ([]models.Review, map[string]interface{}, error) {
	// 1. Query reviews list
	reviews, err := u.reviewRepo.ListReviewsByCourseID(ctx, courseID, isAdminOrTeacher)
	if err != nil {
		return nil, nil, apperrors.NewAppError(apperrors.TypeInternal, "Không thể lấy danh sách đánh giá", err)
	}

	// 2. Query stats
	counts, totalCount, average, err := u.reviewRepo.GetCourseRatingStats(ctx, courseID)
	if err != nil {
		return nil, nil, apperrors.NewAppError(apperrors.TypeInternal, "Lỗi tính toán chỉ số thống kê sao", err)
	}

	// Calculate percentages
	percentages := map[string]float64{
		"1": 0.0, "2": 0.0, "3": 0.0, "4": 0.0, "5": 0.0,
	}
	if totalCount > 0 {
		percentages["1"] = (float64(counts[1]) / float64(totalCount)) * 100
		percentages["2"] = (float64(counts[2]) / float64(totalCount)) * 100
		percentages["3"] = (float64(counts[3]) / float64(totalCount)) * 100
		percentages["4"] = (float64(counts[4]) / float64(totalCount)) * 100
		percentages["5"] = (float64(counts[5]) / float64(totalCount)) * 100
	}

	stats := map[string]interface{}{
		"average_rating": average,
		"total_reviews":  totalCount,
		"rating_counts":  counts,
		"percentages":    percentages,
	}

	return reviews, stats, nil
}

func (u *reviewUseCase) ListAllReviews(ctx context.Context, page, limit int, search string) ([]models.Review, int64, error) {
	reviews, total, err := u.reviewRepo.ListAllReviews(ctx, page, limit, search)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "Lỗi cơ sở dữ liệu khi lấy tất cả đánh giá", err)
	}
	return reviews, total, nil
}
