package handlers

import (
	"strconv"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type CouponHandler struct {
	useCase usecase.CouponUseCase
}

func NewCouponHandler(useCase usecase.CouponUseCase) *CouponHandler {
	return &CouponHandler{useCase: useCase}
}

type CreateCouponRequest struct {
	Code           string    `json:"code"`
	DiscountType   string    `json:"discount_type"` // "percentage" or "fixed"
	DiscountValue  float64   `json:"discount_value"`
	MinOrderAmount float64   `json:"min_order_amount"`
	MaxDiscount    float64   `json:"max_discount"`
	Scope          string    `json:"scope"` // "global" or "course"
	CourseID       *uint     `json:"course_id"`
	ExpiryDate     time.Time `json:"expiry_date"`
	UsageLimit     int       `json:"usage_limit"`
	UserLimit      int       `json:"user_limit"`
}

func (h *CouponHandler) CreateCoupon(c *fiber.Ctx) error {
	var req CreateCouponRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	if req.UserLimit <= 0 {
		req.UserLimit = 1
	}

	coupon := &models.Coupon{
		Code:           req.Code,
		DiscountType:   req.DiscountType,
		DiscountValue:  req.DiscountValue,
		MinOrderAmount: req.MinOrderAmount,
		MaxDiscount:    req.MaxDiscount,
		Scope:          req.Scope,
		CourseID:       req.CourseID,
		ExpiryDate:     req.ExpiryDate,
		UsageLimit:     req.UsageLimit,
		UserLimit:      req.UserLimit,
		IsActive:       true,
	}

	err := h.useCase.CreateCoupon(c.Context(), coupon)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Tạo mã giảm giá mới thành công",
		"data":    coupon,
	})
}

func (h *CouponHandler) CreateTeacherCoupon(c *fiber.Ctx) error {
	teacherIDVal := c.Locals("user_id")
	teacherID, ok := teacherIDVal.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "không thể xác thực giảng viên")
	}

	var req CreateCouponRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	if req.UserLimit <= 0 {
		req.UserLimit = 1
	}

	coupon := &models.Coupon{
		Code:           req.Code,
		DiscountType:   req.DiscountType,
		DiscountValue:  req.DiscountValue,
		MinOrderAmount: req.MinOrderAmount,
		MaxDiscount:    req.MaxDiscount,
		Scope:          req.Scope,
		CourseID:       req.CourseID,
		TeacherID:      &teacherID,
		ExpiryDate:     req.ExpiryDate,
		UsageLimit:     req.UsageLimit,
		UserLimit:      req.UserLimit,
		IsActive:       true,
	}

	err := h.useCase.CreateCoupon(c.Context(), coupon)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Tạo mã giảm giá giảng viên thành công",
		"data":    coupon,
	})
}

func (h *CouponHandler) UpdateTeacherCoupon(c *fiber.Ctx) error {
	teacherIDVal := c.Locals("user_id")
	teacherID, ok := teacherIDVal.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "không thể xác thực giảng viên")
	}

	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã coupon ID không hợp lệ")
	}

	var req CreateCouponRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	coupon := &models.Coupon{
		Code:           req.Code,
		DiscountType:   req.DiscountType,
		DiscountValue:  req.DiscountValue,
		MinOrderAmount: req.MinOrderAmount,
		MaxDiscount:    req.MaxDiscount,
		Scope:          req.Scope,
		CourseID:       req.CourseID,
		TeacherID:      &teacherID,
		ExpiryDate:     req.ExpiryDate,
		UsageLimit:     req.UsageLimit,
		UserLimit:      req.UserLimit,
	}

	err = h.useCase.UpdateCouponInfo(c.Context(), uint(id), coupon)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Cập nhật mã giảm giá thành công",
	})
}

func (h *CouponHandler) UpdateCoupon(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã coupon ID không hợp lệ")
	}

	var req CreateCouponRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	coupon := &models.Coupon{
		Code:           req.Code,
		DiscountType:   req.DiscountType,
		DiscountValue:  req.DiscountValue,
		MinOrderAmount: req.MinOrderAmount,
		MaxDiscount:    req.MaxDiscount,
		Scope:          req.Scope,
		CourseID:       req.CourseID,
		ExpiryDate:     req.ExpiryDate,
		UsageLimit:     req.UsageLimit,
		UserLimit:      req.UserLimit,
	}

	err = h.useCase.UpdateCouponInfo(c.Context(), uint(id), coupon)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Cập nhật mã giảm giá thành công",
	})
}

func (h *CouponHandler) ListCoupons(c *fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")
	search := c.Query("search", "")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	coupons, total, err := h.useCase.ListCoupons(c.Context(), page, limit, search)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"coupons":  coupons,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

func (h *CouponHandler) ListTeacherCoupons(c *fiber.Ctx) error {
	teacherIDVal := c.Locals("user_id")
	teacherID, ok := teacherIDVal.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "không thể xác thực giảng viên")
	}

	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")
	search := c.Query("search", "")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	coupons, total, err := h.useCase.ListTeacherCoupons(c.Context(), teacherID, page, limit, search)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"coupons":  coupons,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

type ToggleStatusRequest struct {
	IsActive bool `json:"is_active"`
}

func (h *CouponHandler) ToggleCouponStatus(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã coupon ID không hợp lệ")
	}

	var req ToggleStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	err = h.useCase.ToggleCouponStatus(c.Context(), uint(id), req.IsActive, nil)
	if err != nil {
		return err
	}

	statusMsg := "kích hoạt"
	if !req.IsActive {
		statusMsg = "vô hiệu hóa"
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã " + statusMsg + " mã giảm giá thành công",
	})
}

func (h *CouponHandler) ToggleTeacherCouponStatus(c *fiber.Ctx) error {
	teacherIDVal := c.Locals("user_id")
	teacherID, ok := teacherIDVal.(uint)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "không thể xác thực giảng viên")
	}

	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã coupon ID không hợp lệ")
	}

	var req ToggleStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	err = h.useCase.ToggleCouponStatus(c.Context(), uint(id), req.IsActive, &teacherID)
	if err != nil {
		return err
	}

	statusMsg := "kích hoạt"
	if !req.IsActive {
		statusMsg = "vô hiệu hóa"
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã " + statusMsg + " mã giảm giá thành công",
	})
}

func (h *CouponHandler) ExpireCoupon(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã coupon ID không hợp lệ")
	}

	err = h.useCase.ExpireCoupon(c.Context(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã thiết lập mã giảm giá hết hạn ngay lập tức thành công",
	})
}
