package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents any account registered in the LMS system.
type User struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	TenantID        uint           `gorm:"uniqueIndex:idx_tenant_email;not null;default:1" json:"tenant_id"`
	Name            string         `gorm:"size:100;not null" json:"name"`
	Email           string         `gorm:"size:100;uniqueIndex:idx_tenant_email;not null" json:"email"`
	Password        string         `gorm:"size:255;not null" json:"-"`                     // Omit password hash in json responses
	Role            string         `gorm:"size:20;default:'student';not null" json:"role"` // admin, teacher, student
	AvatarURL       string         `gorm:"size:255" json:"avatar_url"`
	IsActive        bool           `gorm:"default:true" json:"is_active"`
	IsEmailVerified bool           `gorm:"default:false" json:"is_email_verified"`
	Points          uint           `gorm:"default:0" json:"points"`
	CurrentStreak   uint           `gorm:"default:0" json:"current_streak"`
	HighestStreak   uint           `gorm:"default:0" json:"highest_streak"`
	LastActiveDate  *time.Time     `json:"last_active_date"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}
