package models

import (
	"time"
)

// Withdrawal represents a teacher's request to withdraw their revenue.
type Withdrawal struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TenantID    uint      `gorm:"index:idx_tenant_teacher,priority:1;not null;default:1" json:"tenant_id"`
	TeacherID   uint      `gorm:"index:idx_tenant_teacher,priority:2;not null" json:"teacher_id"`
	Teacher     User      `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Amount      float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	Status      string    `gorm:"size:20;default:'pending'" json:"status"` // pending, approved, rejected, paid
	BankName    string    `gorm:"size:100;not null" json:"bank_name"`
	BankAccount string    `gorm:"size:100;not null" json:"bank_account"`
	AccountName string    `gorm:"size:100;not null" json:"account_name"`
	AdminNote   string    `gorm:"size:255" json:"admin_note,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
