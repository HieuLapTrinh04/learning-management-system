package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type CartHandler struct {
	useCase usecase.CartUseCase
}

func NewCartHandler(useCase usecase.CartUseCase) *CartHandler {
	return &CartHandler{useCase: useCase}
}

func (h *CartHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *CartHandler) GetCart(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	items, totalPrice, err := h.useCase.GetCart(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":     true,
		"items":       items,
		"total_price": totalPrice,
	})
}

type AddToCartRequest struct {
	CourseID uint `json:"course_id"`
}

func (h *CartHandler) AddToCart(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	var req AddToCartRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body format")
	}

	if req.CourseID == 0 {
		return fiber.NewError(fiber.StatusBadRequest, "course_id is required")
	}

	err = h.useCase.AddToCart(c.Context(), studentID, req.CourseID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã thêm khóa học vào giỏ hàng thành công",
	})
}

func (h *CartHandler) RemoveFromCart(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDStr := c.Params("id")
	courseID, err := strconv.ParseUint(courseIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID format")
	}

	err = h.useCase.RemoveFromCart(c.Context(), studentID, uint(courseID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã xóa khóa học khỏi giỏ hàng thành công",
	})
}

type ApplyCouponRequest struct {
	Code string `json:"code"`
}

func (h *CartHandler) ApplyCoupon(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	var req ApplyCouponRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body format")
	}

	coupon, discountAmount, err := h.useCase.ApplyCoupon(c.Context(), studentID, req.Code)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":         true,
		"coupon":          coupon,
		"discount_amount": discountAmount,
	})
}

type CartCheckoutRequest struct {
	CouponCode string `json:"coupon_code"`
}

func (h *CartHandler) Checkout(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	var req CartCheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body format")
	}

	clientIP := c.IP()
	if clientIP == "" || clientIP == "::1" {
		clientIP = "127.0.0.1"
	}

	paymentUrl, err := h.useCase.CheckoutCart(c.Context(), studentID, req.CouponCode, clientIP)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":     true,
		"payment_url": paymentUrl,
		"message":     "Đơn hàng giỏ hàng đã được khởi tạo thành công",
	})
}
