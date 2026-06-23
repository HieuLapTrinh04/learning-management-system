package models

import (
	"time"
	"gorm.io/gorm"
)

type Badge struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	TenantID    uint           `gorm:"index" json:"-"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	IconURL     string         `gorm:"type:varchar(255)" json:"icon_url"`
	Condition   string         `gorm:"type:varchar(100)" json:"condition"` // e.g., "course_completion_1", "points_1000"
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type UserBadge struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BadgeID   uint      `gorm:"not null;index" json:"badge_id"`
	Badge     *Badge    `gorm:"foreignKey:BadgeID" json:"badge,omitempty"`
	TenantID  uint      `gorm:"index" json:"-"`
	EarnedAt  time.Time `gorm:"autoCreateTime" json:"earned_at"`
}
