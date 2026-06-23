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

type CouponUseCase interface {
	CreateCoupon(ctx context.Context, coupon *models.Coupon) error
	ListCoupons(ctx context.Context, page, limit int, search string) ([]models.Coupon, int64, error)
	ListTeacherCoupons(ctx context.Context, teacherID uint, page, limit int, search string) ([]models.Coupon, int64, error)
	UpdateCouponInfo(ctx context.Context, id uint, req *models.Coupon) error
	ToggleCouponStatus(ctx context.Context, id uint, active bool, teacherID *uint) error
	ExpireCoupon(ctx context.Context, id uint) error
	ValidateCouponForStudent(ctx context.Context, studentID uint, code string, cartItems []models.CartItem, cartTotal float64) (*models.Coupon, float64, error)
}

type couponUseCase struct {
	couponRepo repository.CouponRepository
	courseRepo repository.CourseRepository
}

func NewCouponUseCase(couponRepo repository.CouponRepository, courseRepo repository.CourseRepository) CouponUseCase {
	return &couponUseCase{
		couponRepo: couponRepo,
		courseRepo: courseRepo,
	}
}

func (u *couponUseCase) CreateCoupon(ctx context.Context, coupon *models.Coupon) error {
	if coupon.Code == "" {
		return apperrors.NewAppError(apperrors.TypeValidation, "mã coupon không được để trống", nil)
	}

	// Check unique code
	existing, err := u.couponRepo.GetCouponByCode(ctx, coupon.Code)
	if err == nil && existing != nil {
		return apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("mã giảm giá '%s' đã tồn tại", coupon.Code), nil)
	}

	// Validate fields
	if coupon.DiscountType != "percentage" && coupon.DiscountType != "fixed" {
		return apperrors.NewAppError(apperrors.TypeValidation, "loại giảm giá không hợp lệ", nil)
	}
	if coupon.DiscountValue <= 0 {
		return apperrors.NewAppError(apperrors.TypeValidation, "giá trị giảm giá phải lớn hơn 0", nil)
	}
	if coupon.DiscountType == "percentage" && coupon.DiscountValue > 100 {
		return apperrors.NewAppError(apperrors.TypeValidation, "giá trị phần trăm giảm giá không được vượt quá 100%", nil)
	}
	if coupon.Scope != "global" && coupon.Scope != "course" {
		return apperrors.NewAppError(apperrors.TypeValidation, "phạm vi coupon không hợp lệ", nil)
	}
	if coupon.Scope == "course" && (coupon.CourseID == nil || *coupon.CourseID == 0) {
		return apperrors.NewAppError(apperrors.TypeValidation, "phải chọn khóa học cho coupon áp dụng cụ thể", nil)
	}

	if coupon.Scope == "course" {
		course, err := u.courseRepo.GetByID(ctx, *coupon.CourseID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy khóa học liên kết", err)
			}
			return apperrors.NewAppError(apperrors.TypeInternal, "lỗi truy vấn khóa học", err)
		}

		if coupon.TeacherID != nil && course.TeacherID != *coupon.TeacherID {
			return apperrors.NewAppError(apperrors.TypeForbidden, "bạn không có quyền tạo mã giảm giá cho khóa học này", nil)
		}

		if course.Price == 0 {
			return apperrors.NewAppError(apperrors.TypeValidation, "không thể áp dụng coupon cho khóa học miễn phí", nil)
		}
	}

	coupon.CreatedAt = time.Now()
	coupon.UpdatedAt = time.Now()

	err = u.couponRepo.CreateCoupon(ctx, coupon)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể lưu mã giảm giá vào cơ sở dữ liệu", err)
	}
	return nil
}

func (u *couponUseCase) ListCoupons(ctx context.Context, page, limit int, search string) ([]models.Coupon, int64, error) {
	coupons, total, err := u.couponRepo.ListCoupons(ctx, page, limit, search)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "lỗi khi tải danh sách mã giảm giá", err)
	}
	return coupons, total, nil
}

func (u *couponUseCase) ListTeacherCoupons(ctx context.Context, teacherID uint, page, limit int, search string) ([]models.Coupon, int64, error) {
	coupons, total, err := u.couponRepo.ListTeacherCoupons(ctx, teacherID, page, limit, search)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "lỗi khi tải danh sách mã giảm giá", err)
	}
	return coupons, total, nil
}

func (u *couponUseCase) UpdateCouponInfo(ctx context.Context, id uint, req *models.Coupon) error {
	coupon, err := u.couponRepo.GetCouponByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy mã giảm giá", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "lỗi khi tải mã giảm giá", err)
	}

	if req.Code != "" && req.Code != coupon.Code {
		existing, err := u.couponRepo.GetCouponByCode(ctx, req.Code)
		if err == nil && existing != nil {
			return apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("mã giảm giá '%s' đã tồn tại", req.Code), nil)
		}
		coupon.Code = req.Code
	}

	if req.TeacherID != nil {
		if coupon.TeacherID == nil || *coupon.TeacherID != *req.TeacherID {
			return apperrors.NewAppError(apperrors.TypeForbidden, "bạn không có quyền chỉnh sửa mã giảm giá này", nil)
		}
	}

	if req.DiscountType == "percentage" || req.DiscountType == "fixed" {
		coupon.DiscountType = req.DiscountType
	}
	if req.DiscountValue > 0 {
		coupon.DiscountValue = req.DiscountValue
	}
	if coupon.DiscountType == "percentage" && coupon.DiscountValue > 100 {
		return apperrors.NewAppError(apperrors.TypeValidation, "giá trị phần trăm giảm giá không được vượt quá 100%", nil)
	}

	coupon.MinOrderAmount = req.MinOrderAmount
	coupon.MaxDiscount = req.MaxDiscount
	
	if req.Scope == "global" || req.Scope == "course" {
		coupon.Scope = req.Scope
	}
	
	if req.Scope == "course" {
		if req.CourseID == nil || *req.CourseID == 0 {
			return apperrors.NewAppError(apperrors.TypeValidation, "phải chọn khóa học cho coupon áp dụng cụ thể", nil)
		}
		course, err := u.courseRepo.GetByID(ctx, *req.CourseID)
		if err != nil || course == nil {
			return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy khóa học liên kết", err)
		}
		coupon.CourseID = req.CourseID
	} else if req.Scope == "global" {
		coupon.CourseID = nil
	}

	if !req.ExpiryDate.IsZero() {
		coupon.ExpiryDate = req.ExpiryDate
	}
	
	if req.UsageLimit >= 0 {
		coupon.UsageLimit = req.UsageLimit
	}
	if req.UserLimit > 0 {
		coupon.UserLimit = req.UserLimit
	}

	coupon.UpdatedAt = time.Now()

	err = u.couponRepo.UpdateCoupon(ctx, coupon)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể cập nhật mã giảm giá", err)
	}
	return nil
}

func (u *couponUseCase) ToggleCouponStatus(ctx context.Context, id uint, active bool, teacherID *uint) error {
	coupon, err := u.couponRepo.GetCouponByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy mã giảm giá", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "lỗi khi tải mã giảm giá", err)
	}

	if teacherID != nil {
		if coupon.TeacherID == nil || *coupon.TeacherID != *teacherID {
			return apperrors.NewAppError(apperrors.TypeForbidden, "bạn không có quyền thay đổi mã giảm giá này", nil)
		}
	}

	coupon.IsActive = active
	coupon.UpdatedAt = time.Now()

	err = u.couponRepo.UpdateCoupon(ctx, coupon)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể cập nhật trạng thái mã giảm giá", err)
	}
	return nil
}

func (u *couponUseCase) ExpireCoupon(ctx context.Context, id uint) error {
	coupon, err := u.couponRepo.GetCouponByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "không tìm thấy mã giảm giá", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "lỗi khi tải mã giảm giá", err)
	}

	coupon.ExpiryDate = time.Now()
	coupon.IsActive = false
	coupon.UpdatedAt = time.Now()

	err = u.couponRepo.UpdateCoupon(ctx, coupon)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "không thể vô hiệu hóa mã giảm giá", err)
	}
	return nil
}

func (u *couponUseCase) ValidateCouponForStudent(ctx context.Context, studentID uint, code string, cartItems []models.CartItem, cartTotal float64) (*models.Coupon, float64, error) {
	if code == "" {
		return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, "mã coupon không được để trống", nil)
	}

	coupon, err := u.couponRepo.GetCouponByCode(ctx, code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, apperrors.NewAppError(apperrors.TypeNotFound, "mã giảm giá không tồn tại hoặc đã bị tắt", err)
		}
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "lỗi truy vấn mã giảm giá", err)
	}

	// 1. Check active state
	if !coupon.IsActive {
		return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, "mã giảm giá đã ngừng hoạt động", nil)
	}

	// 2. Check ExpiryDate
	if time.Now().After(coupon.ExpiryDate) {
		return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, "mã giảm giá đã hết hạn sử dụng", nil)
	}

	// 3. Check usage limit
	if coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit {
		return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, "mã giảm giá đã hết lượt sử dụng trên hệ thống", nil)
	}

	// 4. Check per-user limit
	if studentID > 0 {
		usageCount, errUsage := u.couponRepo.CountUserCouponUsage(ctx, studentID, coupon.ID)
		if errUsage == nil && int(usageCount) >= coupon.UserLimit {
			return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, fmt.Sprintf("bạn đã đạt giới hạn sử dụng mã này (%d lần)", coupon.UserLimit), nil)
		}
	}

	var discountAmount float64

	// 5. Check Scope & calculate discounts
	if coupon.Scope == "global" {
		applicableTotal := cartTotal

		if coupon.TeacherID != nil {
			// Coupon only applies to courses taught by this teacher
			applicableTotal = 0
			for _, item := range cartItems {
				if item.Course.TeacherID == *coupon.TeacherID {
					applicableTotal += item.Course.Price
				}
			}
			if applicableTotal == 0 {
				return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, "mã giảm giá này chỉ áp dụng cho các khóa học của giảng viên phát hành", nil)
			}
		}

		// Minimum Purchase Requirement (checked against the applicable portion)
		if applicableTotal < coupon.MinOrderAmount {
			return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, fmt.Sprintf("tổng giá trị các khóa học hợp lệ phải đạt tối thiểu %.0f đ để áp dụng mã giảm giá này", coupon.MinOrderAmount), nil)
		}

		if coupon.DiscountType == "percentage" {
			discountAmount = applicableTotal * (coupon.DiscountValue / 100.0)
			if coupon.MaxDiscount > 0 && discountAmount > coupon.MaxDiscount {
				discountAmount = coupon.MaxDiscount
			}
		} else if coupon.DiscountType == "fixed" {
			discountAmount = coupon.DiscountValue
		}
	} else if coupon.Scope == "course" {
		// Target course-specific coupon
		var foundItem *models.CartItem
		for i := range cartItems {
			if cartItems[i].CourseID == *coupon.CourseID {
				foundItem = &cartItems[i]
				break
			}
		}

		if foundItem == nil {
			return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, fmt.Sprintf("mã giảm giá chỉ áp dụng khi mua khóa học: %s", coupon.Course.Title), nil)
		}

		coursePrice := foundItem.Course.Price
		if coursePrice < coupon.MinOrderAmount {
			return nil, 0, apperrors.NewAppError(apperrors.TypeValidation, fmt.Sprintf("giá khóa học '%s' phải đạt tối thiểu %.0f đ để áp dụng mã giảm giá này", coupon.Course.Title, coupon.MinOrderAmount), nil)
		}

		if coupon.DiscountType == "percentage" {
			discountAmount = coursePrice * (coupon.DiscountValue / 100.0)
			if coupon.MaxDiscount > 0 && discountAmount > coupon.MaxDiscount {
				discountAmount = coupon.MaxDiscount
			}
		} else if coupon.DiscountType == "fixed" {
			discountAmount = coupon.DiscountValue
		}

		// Cap discount to course price itself
		if discountAmount > coursePrice {
			discountAmount = coursePrice
		}
	}

	// Cap discount to total order price
	if discountAmount > cartTotal {
		discountAmount = cartTotal
	}

	return coupon, discountAmount, nil
}
