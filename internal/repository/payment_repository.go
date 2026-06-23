package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PaymentRepository interface {
	CreateOrder(ctx context.Context, order *models.Order) error
	CreateOrderItems(ctx context.Context, items []models.OrderItem) error
	GetOrderByTxnRef(ctx context.Context, txnRef string) (*models.Order, error)
	GetOrderByID(ctx context.Context, id uint) (*models.Order, error)
	GetOrderByIDWithItems(ctx context.Context, id uint) (*models.Order, error)
	UpdateOrder(ctx context.Context, order *models.Order) error
	ListOrderItems(ctx context.Context, orderID uint) ([]models.OrderItem, error)
	CreateOrderWithItems(ctx context.Context, order *models.Order, items []models.OrderItem) error
	SettleOrder(ctx context.Context, orderID uint, status string, enrollments []models.Enrollment) error
	ListOrdersByStudentID(ctx context.Context, studentID uint) ([]models.Order, error)
	ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error)
	ListTeacherTransactions(ctx context.Context, teacherID uint, page, limit int) ([]models.OrderItem, int64, error)
	RefundOrder(ctx context.Context, orderID uint) error

	// Withdrawal Methods
	GetTeacherBalance(ctx context.Context, teacherID uint) (float64, float64, error)
	CreateWithdrawal(ctx context.Context, withdrawal *models.Withdrawal) error
	ListTeacherWithdrawals(ctx context.Context, teacherID uint) ([]models.Withdrawal, error)
	ListAdminWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error)
	UpdateWithdrawalStatus(ctx context.Context, id uint, status, adminNote string) error
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) CreateOrder(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *paymentRepository) CreateOrderItems(ctx context.Context, items []models.OrderItem) error {
	return r.db.WithContext(ctx).Create(&items).Error
}

func (r *paymentRepository) GetOrderByTxnRef(ctx context.Context, txnRef string) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems").Where("txn_ref = ?", txnRef).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *paymentRepository) GetOrderByID(ctx context.Context, id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems").First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *paymentRepository) UpdateOrder(ctx context.Context, order *models.Order) error {
	return r.db.WithContext(ctx).Save(order).Error
}

func (r *paymentRepository) ListOrderItems(ctx context.Context, orderID uint) ([]models.OrderItem, error) {
	var items []models.OrderItem
	err := r.db.WithContext(ctx).Preload("Course").Where("order_id = ?", orderID).Find(&items).Error
	return items, err
}

func (r *paymentRepository) CreateOrderWithItems(ctx context.Context, order *models.Order, items []models.OrderItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].OrderID = order.ID
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *paymentRepository) SettleOrder(ctx context.Context, orderID uint, status string, enrollments []models.Enrollment) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var paidAt *time.Time
		if status == "paid" {
			now := time.Now()
			paidAt = &now
		}

		// Row-level lock (SELECT ... FOR UPDATE) to prevent concurrent settlement requests
		var order models.Order
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&order, orderID).Error; err != nil {
			return err
		}

		// Double-check status under lock
		if order.Status != "pending" {
			return fmt.Errorf("order %d already settled with status %s", orderID, order.Status)
		}

		if err := tx.Model(&models.Order{}).Where("id = ?", orderID).Updates(map[string]interface{}{
			"status":  status,
			"paid_at": paidAt,
		}).Error; err != nil {
			return err
		}

		if status == "paid" {
			// Record coupon usage if applicable
			if order.CouponCode != "" {
				var coupon models.Coupon
				err := tx.Where("code = ?", order.CouponCode).First(&coupon).Error
				if err == nil {
					// 1. Create CouponUsage
					usage := models.CouponUsage{
						CouponID:  coupon.ID,
						UserID:    order.StudentID,
						OrderID:   order.ID,
						CreatedAt: time.Now(),
					}
					if errUsage := tx.Create(&usage).Error; errUsage != nil {
						return errUsage
					}

					// 2. Increment UsedCount
					if errInc := tx.Model(&models.Coupon{}).Where("id = ?", coupon.ID).UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error; errInc != nil {
						return errInc
					}
				}
			}
		}

		if status == "paid" && len(enrollments) > 0 {
			// Check if any enrollment already exists to avoid unique constraint violations
			for _, enrollment := range enrollments {
				var count int64
				err := tx.Model(&models.Enrollment{}).
					Where("student_id = ? AND course_id = ?", enrollment.StudentID, enrollment.CourseID).
					Count(&count).Error
				if err != nil {
					return err
				}
				if count == 0 {
					if err := tx.Create(&enrollment).Error; err != nil {
						return err
					}
				}
			}
		}
		return nil
	})
}

func (r *paymentRepository) ListOrdersByStudentID(ctx context.Context, studentID uint) ([]models.Order, error) {
	var orders []models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems.Course").Where("student_id = ?", studentID).Order("created_at desc").Find(&orders).Error
	return orders, err
}

func (r *paymentRepository) GetOrderByIDWithItems(ctx context.Context, id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).Preload("OrderItems.Course").First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *paymentRepository) ListAllTransactions(ctx context.Context, page, limit int, status, search string) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	db := r.db.WithContext(ctx).Model(&models.Order{})

	if status != "" {
		db = db.Where("status = ?", status)
	}

	if search != "" {
		db = db.Where("txn_ref LIKE ?", "%"+search+"%")
	}

	err := db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err = db.Preload("OrderItems.Course").Preload("Student").Order("created_at desc").Limit(limit).Offset(offset).Find(&orders).Error
	return orders, total, err
}

func (r *paymentRepository) ListTeacherTransactions(ctx context.Context, teacherID uint, page, limit int) ([]models.OrderItem, int64, error) {
	var items []models.OrderItem
	var total int64

	// Query order items where the related course belongs to the teacher AND the order is paid
	db := r.db.WithContext(ctx).Model(&models.OrderItem{}).
		Joins("JOIN courses ON courses.id = order_items.course_id").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("courses.teacher_id = ? AND orders.status = 'paid'", teacherID)

	err := db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	// Preload Order and Course for UI rendering
	err = db.Preload("Course").
		Preload("Order"). // Need a way to preload Order? Wait, OrderItem doesn't have Order relation in struct, it just has OrderID.
		Order("order_items.id desc").Limit(limit).Offset(offset).Find(&items).Error

	return items, total, err
}

func (r *paymentRepository) RefundOrder(ctx context.Context, orderID uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		if err := tx.Preload("OrderItems").First(&order, orderID).Error; err != nil {
			return err
		}

		if order.Status != "paid" {
			return fmt.Errorf("only paid orders can be refunded, current status is %s", order.Status)
		}

		if err := tx.Model(&order).Update("status", "refunded").Error; err != nil {
			return err
		}

		for _, item := range order.OrderItems {
			if err := tx.Where("student_id = ? AND course_id = ?", order.StudentID, item.CourseID).Delete(&models.Enrollment{}).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// -------------------------------------------------------------
// Withdrawal Methods
// -------------------------------------------------------------

func (r *paymentRepository) GetTeacherBalance(ctx context.Context, teacherID uint) (float64, float64, error) {
	var totalRevenue float64
	var totalWithdrawn float64

	// 1. Calculate total revenue from paid orders
	err := r.db.WithContext(ctx).Model(&models.OrderItem{}).
		Joins("JOIN courses ON courses.id = order_items.course_id").
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("courses.teacher_id = ? AND orders.status = 'paid'", teacherID).
		Select("COALESCE(SUM(order_items.teacher_revenue), 0)").Scan(&totalRevenue).Error
	if err != nil {
		return 0, 0, err
	}

	// 2. Calculate total withdrawn (approved, paid, pending) -> anything not rejected
	err = r.db.WithContext(ctx).Model(&models.Withdrawal{}).
		Where("teacher_id = ? AND status != 'rejected'", teacherID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalWithdrawn).Error
	if err != nil {
		return 0, 0, err
	}

	return totalRevenue, totalWithdrawn, nil
}

func (r *paymentRepository) CreateWithdrawal(ctx context.Context, withdrawal *models.Withdrawal) error {
	return r.db.WithContext(ctx).Create(withdrawal).Error
}

func (r *paymentRepository) ListTeacherWithdrawals(ctx context.Context, teacherID uint) ([]models.Withdrawal, error) {
	var list []models.Withdrawal
	err := r.db.WithContext(ctx).Where("teacher_id = ?", teacherID).Order("created_at desc").Find(&list).Error
	return list, err
}

func (r *paymentRepository) ListAdminWithdrawals(ctx context.Context, status string) ([]models.Withdrawal, error) {
	var list []models.Withdrawal
	db := r.db.WithContext(ctx).Preload("Teacher")
	if status != "" {
		db = db.Where("status = ?", status)
	}
	err := db.Order("created_at desc").Find(&list).Error
	return list, err
}

func (r *paymentRepository) UpdateWithdrawalStatus(ctx context.Context, id uint, status, adminNote string) error {
	return r.db.WithContext(ctx).Model(&models.Withdrawal{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     status,
		"admin_note": adminNote,
	}).Error
}
