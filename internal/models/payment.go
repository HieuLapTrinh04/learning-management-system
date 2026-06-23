package models

import (
	"time"
)

// Order defines transactional invoice logs.
type Order struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	TenantID    uint        `gorm:"uniqueIndex:idx_tenant_txn_ref;index:idx_tenant_student,priority:1;not null;default:1" json:"tenant_id"`
	StudentID   uint        `gorm:"index:idx_tenant_student,priority:2;not null" json:"student_id"`
	TotalAmount float64     `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	Status      string      `gorm:"size:20;default:'pending'" json:"status"` // pending, paid, failed, refunded
	TxnRef      string      `gorm:"size:100;uniqueIndex:idx_tenant_txn_ref;not null" json:"txn_ref"` // VNPay transaction reference
	CreatedAt   time.Time   `json:"created_at"`
	PaidAt         *time.Time  `json:"paid_at,omitempty"`
	DiscountAmount float64     `gorm:"type:decimal(10,2);default:0.00" json:"discount_amount"`
	CouponCode     string      `gorm:"size:50" json:"coupon_code,omitempty"`
	OrderItems     []OrderItem `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"order_items"`
	Student        *User       `gorm:"foreignKey:StudentID" json:"student,omitempty"`
}

// OrderItem references courses inside an invoice.
type OrderItem struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	TenantID uint    `gorm:"not null;default:1" json:"tenant_id"`
	OrderID  uint    `gorm:"not null" json:"order_id"`
	Order    *Order  `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	CourseID uint    `gorm:"not null" json:"course_id"`
	Course   Course  `gorm:"foreignKey:CourseID" json:"course"`
	Price          float64 `gorm:"type:decimal(10,2);not null" json:"price"` // Catalog price at checkout
	FinalPrice     float64 `gorm:"type:decimal(10,2);not null;default:0" json:"final_price"` // Price after pro-rated discount
	TeacherRevenue float64 `gorm:"type:decimal(10,2);not null;default:0" json:"teacher_revenue"` // FinalPrice * 0.7
}
