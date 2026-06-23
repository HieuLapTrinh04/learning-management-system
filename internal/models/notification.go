package models

import (
	"time"
)

// Notification represents real-time and persistent alerts sent to users.
type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1" json:"tenant_id"`
	UserID    uint      `gorm:"not null;index:idx_notifications_user_read" json:"user_id"`
	Title     string    `gorm:"size:150;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IsRead    bool      `gorm:"default:false;not null;index:idx_notifications_user_read" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
