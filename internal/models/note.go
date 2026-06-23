package models

import (
	"time"
	"gorm.io/gorm"
)

type Note struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	UserID         uint           `gorm:"not null;index" json:"user_id"`
	User           *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	LessonID       uint           `gorm:"not null;index" json:"lesson_id"`
	Lesson         *Lesson        `gorm:"foreignKey:LessonID" json:"lesson,omitempty"`
	Content        string         `gorm:"type:text;not null" json:"content"`
	VideoTimestamp int            `gorm:"not null;default:0" json:"video_timestamp"` // Timestamp in seconds
	TenantID       uint           `gorm:"index" json:"-"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
