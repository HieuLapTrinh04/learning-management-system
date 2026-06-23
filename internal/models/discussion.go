package models

import "time"

// Discussion represents a Q&A thread or comment in a lesson.
type Discussion struct {
	ID        uint          `gorm:"primaryKey" json:"id"`
	TenantID  uint          `gorm:"index:idx_tenant_lesson_discussion,priority:1;not null;default:1" json:"tenant_id"`
	LessonID  uint          `gorm:"index:idx_tenant_lesson_discussion,priority:2;not null" json:"lesson_id"`
	Lesson    Lesson        `gorm:"foreignKey:LessonID" json:"-"`
	UserID    uint          `gorm:"not null" json:"user_id"`
	User      User          `gorm:"foreignKey:UserID" json:"user"`
	ParentID  *uint         `gorm:"index" json:"parent_id"` // null for root question
	Parent    *Discussion   `gorm:"foreignKey:ParentID" json:"-"`
	Content   string        `gorm:"type:text;not null" json:"content"`
	Replies   []Discussion  `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}
