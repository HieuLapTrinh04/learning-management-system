package models

import "time"

// CartItem represents a course added to a student's shopping cart.
type CartItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"uniqueIndex:idx_tenant_student_course_cart;not null;default:1" json:"tenant_id"`
	StudentID uint      `gorm:"uniqueIndex:idx_tenant_student_course_cart;not null" json:"student_id"`
	Student   User      `gorm:"foreignKey:StudentID" json:"-"`
	CourseID  uint      `gorm:"uniqueIndex:idx_tenant_student_course_cart;not null" json:"course_id"`
	Course    Course    `gorm:"foreignKey:CourseID" json:"course"`
	CreatedAt time.Time `json:"created_at"`
}

// Coupon defines discount coupons.
type Coupon struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	TenantID       uint       `gorm:"uniqueIndex:idx_tenant_coupon_code;not null;default:1" json:"tenant_id"`
	Code           string     `gorm:"size:50;uniqueIndex:idx_tenant_coupon_code;not null" json:"code"`
	DiscountType   string     `gorm:"size:20;not null;default:'percentage'" json:"discount_type"` // "percentage" or "fixed"
	DiscountValue  float64    `gorm:"type:decimal(10,2);not null" json:"discount_value"`          // Percentage (e.g. 10.0) or fixed value (e.g. 50000.0)
	MinOrderAmount float64    `gorm:"type:decimal(10,2);default:0.00" json:"min_order_amount"`
	MaxDiscount    float64    `gorm:"type:decimal(10,2);default:0.00" json:"max_discount"` // Cap amount
	Scope          string     `gorm:"size:20;not null;default:'global'" json:"scope"`      // "global" or "course"
	TeacherID      *uint      `json:"teacher_id,omitempty"`
	Teacher        *User      `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	CourseID       *uint      `json:"course_id,omitempty"`
	Course         *Course    `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	ExpiryDate     time.Time  `json:"expiry_date"`
	UsageLimit     int        `gorm:"default:0" json:"usage_limit"` // 0 means unlimited
	UsedCount      int        `gorm:"default:0" json:"used_count"`
	UserLimit      int        `gorm:"default:1" json:"user_limit"` // Uses per user, e.g. 1
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// CouponUsage tracks which users have used which coupons in which orders.
type CouponUsage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1" json:"tenant_id"`
	CouponID  uint      `gorm:"not null;uniqueIndex:idx_coupon_user_order" json:"coupon_id"`
	Coupon    Coupon    `gorm:"foreignKey:CouponID" json:"-"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_coupon_user_order" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	OrderID   uint      `gorm:"not null;uniqueIndex:idx_coupon_user_order" json:"order_id"`
	Order     Order     `gorm:"foreignKey:OrderID" json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

