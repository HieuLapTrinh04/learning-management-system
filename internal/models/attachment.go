package models

import "time"

// Attachment represents a file attached to a lesson for download.
type Attachment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"index:idx_tenant_lesson_attachment,priority:1;not null;default:1" json:"tenant_id"`
	LessonID  uint      `gorm:"index:idx_tenant_lesson_attachment,priority:2;not null" json:"lesson_id"`
	Lesson    Lesson    `gorm:"foreignKey:LessonID" json:"-"`
	FileName  string    `gorm:"size:255;not null" json:"file_name"`
	FileURL   string    `gorm:"size:255;not null" json:"file_url"`
	FileSize  int64     `gorm:"default:0" json:"file_size"` // Size in bytes
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
