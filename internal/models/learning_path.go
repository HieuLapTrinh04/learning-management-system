package models

import (
	"time"
	"gorm.io/gorm"
)

// LearningPath groups multiple courses into a sequential roadmap
type LearningPath struct {
	ID           uint                 `gorm:"primarykey" json:"id"`
	Title        string               `gorm:"type:varchar(255);not null" json:"title"`
	Description  string               `gorm:"type:text" json:"description"`
	ThumbnailURL string               `gorm:"type:varchar(255)" json:"thumbnail_url"`
	TenantID     uint                 `gorm:"index" json:"-"`
	Courses      []LearningPathCourse `gorm:"foreignKey:LearningPathID" json:"courses,omitempty"`
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	DeletedAt    gorm.DeletedAt       `gorm:"index" json:"-"`
}

// LearningPathCourse is the many-to-many relationship mapping courses to paths with a specific order
type LearningPathCourse struct {
	ID             uint         `gorm:"primarykey" json:"id"`
	LearningPathID uint         `gorm:"not null;index" json:"learning_path_id"`
	CourseID       uint         `gorm:"not null;index" json:"course_id"`
	Course         *Course      `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	SequenceOrder  int          `gorm:"not null;default:0" json:"sequence_order"` // The order in the roadmap
	TenantID       uint         `gorm:"index" json:"-"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}
