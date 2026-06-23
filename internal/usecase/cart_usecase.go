package usecase

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"gorm.io/gorm"
)

type CartUseCase interface {
	GetCart(ctx context.Context, studentID uint) ([]models.CartItem, float64, error)
	AddToCart(ctx context.Context, studentID, courseID uint) error
	RemoveFromCart(ctx context.Context, studentID, courseID uint) error
	ApplyCoupon(ctx context.Context, studentID uint, code string) (*models.Coupon, float64, error)
	CheckoutCart(ctx context.Context, studentID uint, couponCode string, clientIP string) (string, error)
}

type cartUseCase struct {
	cartRepo       repository.CartRepository
	courseRepo     repository.CourseRepository
	enrollmentRepo repository.EnrollmentRepository
	paymentRepo    repository.PaymentRepository
	couponUseCase  CouponUseCase
	cfg            *config.Config
}

func NewCartUseCase(
	cartRepo repository.CartRepository,
	courseRepo repository.CourseRepository,
	enrollmentRepo repository.EnrollmentRepository,
	paymentRepo repository.PaymentRepository,
	couponUseCase CouponUseCase,
	cfg *config.Config,
) CartUseCase {
	return &cartUseCase{
		cartRepo:       cartRepo,
		courseRepo:     courseRepo,
		enrollmentRepo: enrollmentRepo,
		paymentRepo:    paymentRepo,
		couponUseCase:  couponUseCase,
		cfg:            cfg,
	}
}

func (u *cartUseCase) GetCart(ctx context.Context, studentID uint) ([]models.CartItem, float64, error) {
	items, err := u.cartRepo.GetCartItems(ctx, studentID)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to load cart items", err)
	}

	var totalPrice float64
	var validItems []models.CartItem

	for _, item := range items {
		// Auto-cleanup: if student already enrolled, remove from cart silently
		existing, errEnroll := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, item.CourseID)
		if errEnroll == nil && existing != nil {
			_ = u.cartRepo.RemoveCartItem(ctx, studentID, item.CourseID)
			continue
		}
		totalPrice += item.Course.Price
		validItems = append(validItems, item)
	}

	return validItems, totalPrice, nil
}

func (u *cartUseCase) AddToCart(ctx context.Context, studentID, courseID uint) error {
	course, err := u.courseRepo.GetByID(ctx, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.Status != "published" {
		return apperrors.NewAppError(apperrors.TypeForbidden, "cannot add to cart: course is not published", nil)
	}

	// 1. Verify student is not already enrolled
	existingEnrollment, errEnroll := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, courseID)
	if errEnroll == nil && existingEnrollment != nil {
		return apperrors.NewAppError(apperrors.TypeConflict, fmt.Sprintf("you are already enrolled in course: %s", course.Title), nil)
	}

	// 2. Check if already in cart to prevent duplicates
	items, err := u.cartRepo.GetCartItems(ctx, studentID)
	if err == nil {
		for _, item := range items {
			if item.CourseID == courseID {
				return nil // Idempotent: already in cart, return success
			}
		}
	}

	cartItem := &models.CartItem{
		StudentID: studentID,
		CourseID:  courseID,
		CreatedAt: time.Now(),
	}

	err = u.cartRepo.AddCartItem(ctx, cartItem)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to add item to cart", err)
	}

	return nil
}

func (u *cartUseCase) RemoveFromCart(ctx context.Context, studentID, courseID uint) error {
	err := u.cartRepo.RemoveCartItem(ctx, studentID, courseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to remove item from cart", err)
	}
	return nil
}

func (u *cartUseCase) ApplyCoupon(ctx context.Context, studentID uint, code string) (*models.Coupon, float64, error) {
	// 1. Get cart items and total amount
	items, totalAmount, err := u.GetCart(ctx, studentID)
	if err != nil {
		return nil, 0, err
	}

	// 2. Delegate to CouponUseCase
	return u.couponUseCase.ValidateCouponForStudent(ctx, studentID, code, items, totalAmount)
}

func (u *cartUseCase) CheckoutCart(ctx context.Context, studentID uint, couponCode string, clientIP string) (string, error) {
	// 1. Get cart items
	items, totalAmount, err := u.GetCart(ctx, studentID)
	if err != nil {
		return "", err
	}

	if len(items) == 0 {
		return "", apperrors.NewAppError(apperrors.TypeValidation, "your shopping cart is empty", nil)
	}

	// 2. Validate Coupon and calculate discount
	var discountAmount float64
	var appliedCoupon *models.Coupon
	if couponCode != "" {
		coupon, discount, errCoupon := u.ApplyCoupon(ctx, studentID, couponCode)
		if errCoupon != nil {
			return "", errCoupon
		}
		appliedCoupon = coupon
		discountAmount = discount
	}

	checkoutAmount := totalAmount - discountAmount
	if checkoutAmount < 0 {
		checkoutAmount = 0
	}

	// 3. Generate reference number
	txnRef := fmt.Sprintf("LMS%dTXN%d", studentID, time.Now().UnixNano()/1e6)

	order := &models.Order{
		StudentID:      studentID,
		TotalAmount:    checkoutAmount,
		DiscountAmount: discountAmount,
		Status:         "pending",
		TxnRef:         txnRef,
	}
	if appliedCoupon != nil {
		order.CouponCode = appliedCoupon.Code
	}

	var orderItems []models.OrderItem
	for _, item := range items {
		// Calculate pro-rated discount
		itemDiscount := 0.0
		if totalAmount > 0 && discountAmount > 0 {
			itemDiscount = (item.Course.Price / totalAmount) * discountAmount
		}
		
		finalPrice := item.Course.Price - itemDiscount
		if finalPrice < 0 {
			finalPrice = 0
		}

		orderItems = append(orderItems, models.OrderItem{
			CourseID:       item.CourseID,
			Price:          item.Course.Price,
			FinalPrice:     finalPrice,
			TeacherRevenue: finalPrice * 0.7, // 70% commission
		})
	}

	// 4. Save order and clear cart in database transaction (implemented in repo or inline usecase using paymentRepo.CreateOrderWithItems)
	// We will implement order saving and cart clearing under a database transaction block inside usecase.
	// Since we don't have a direct GORM transaction handle inside usecase, wait, u.paymentRepo.CreateOrderWithItems creates the order.
	// Can we clear the cart after that? Yes. But to make it transactional, we can just call:
	err = u.paymentRepo.CreateOrderWithItems(ctx, order, orderItems)
	if err != nil {
		return "", apperrors.NewAppError(apperrors.TypeInternal, "failed to create payment order", err)
	}

	// NOTE: We DO NOT clear the cart here. The cart will be auto-cleaned by GetCart() 
	// when the user successfully pays and receives an enrollment record.
	// This ensures that if the user cancels the VNPay window, their cart remains intact.

	// 5. Construct VNPay sandbox parameters and sign redirection URL
	loc := time.FixedZone("GMT+7", 7*60*60)
	nowInVN := time.Now().In(loc)

	vnpayParams := url.Values{}
	vnpayParams.Set("vnp_Version", "2.1.0")
	vnpayParams.Set("vnp_Command", "pay")
	vnpayParams.Set("vnp_TmnCode", u.cfg.VNPayTmnCode)
	vnpayParams.Set("vnp_Amount", fmt.Sprintf("%d", int64(checkoutAmount*100)))
	vnpayParams.Set("vnp_CreateDate", nowInVN.Format("20060102150405"))
	vnpayParams.Set("vnp_CurrCode", "VND")
	vnpayParams.Set("vnp_IpAddr", clientIP)
	vnpayParams.Set("vnp_Locale", "vn")
	vnpayParams.Set("vnp_OrderInfo", fmt.Sprintf("Thanh toan gio hang %s", txnRef))
	vnpayParams.Set("vnp_OrderType", "other")
	vnpayParams.Set("vnp_ReturnUrl", u.cfg.VNPayReturnURL)
	vnpayParams.Set("vnp_TxnRef", txnRef)

	checkoutUrl := utils.BuildVNPayURL(u.cfg.VNPayURL, u.cfg.VNPayHashSecret, vnpayParams)
	return checkoutUrl, nil
}
