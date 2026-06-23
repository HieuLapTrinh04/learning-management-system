package models

import (
	"time"

	"gorm.io/gorm"
)

// Category separates courses into distinct disciplines.
type Category struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	TenantID    uint   `gorm:"uniqueIndex:idx_tenant_cat_name;uniqueIndex:idx_tenant_cat_slug;not null;default:1" json:"tenant_id"`
	Name        string `gorm:"size:100;uniqueIndex:idx_tenant_cat_name;not null" json:"name"`
	Slug        string `gorm:"size:100;uniqueIndex:idx_tenant_cat_slug;not null" json:"slug"`
	Description string `gorm:"size:255" json:"description"`
}

// Course holds metadata and content outline for lectures.
type Course struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	TenantID     uint           `gorm:"uniqueIndex:idx_tenant_course_slug;index:idx_tenant_teacher,priority:1;index:idx_tenant_category,priority:1;not null;default:1" json:"tenant_id"`
	Title        string         `gorm:"size:150;not null" json:"title"`
	Slug         string         `gorm:"size:150;uniqueIndex:idx_tenant_course_slug;not null" json:"slug"`
	Subtitle     string         `gorm:"size:255" json:"subtitle"`
	Description  string         `gorm:"type:text" json:"description"`
	Price        float64        `gorm:"type:decimal(10,2);default:0.00" json:"price"`
	ThumbnailURL string         `gorm:"size:255" json:"thumbnail_url"`
	TeacherID    uint           `gorm:"index:idx_tenant_teacher,priority:2;not null" json:"teacher_id"`
	Teacher      User           `gorm:"foreignKey:TeacherID" json:"teacher"`
	CategoryID   uint           `gorm:"index:idx_tenant_category,priority:2;not null" json:"category_id"`
	Category     Category       `gorm:"foreignKey:CategoryID" json:"category"`
	Status       string         `gorm:"size:20;index;default:'draft'" json:"status"` // draft, pending, published
	Sections     []Section      `gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"sections,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Section acts as a folder containing lessons.
type Section struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	TenantID    uint         `gorm:"index:idx_tenant_course,priority:1;not null;default:1" json:"tenant_id"`
	CourseID    uint         `gorm:"index:idx_tenant_course,priority:2;not null" json:"course_id"`
	Title       string       `gorm:"size:150;not null" json:"title"`
	Order       int          `gorm:"column:sort_order;default:0" json:"order"`
	Lessons     []Lesson     `gorm:"foreignKey:SectionID;constraint:OnDelete:CASCADE" json:"lessons,omitempty"`
	Quizzes     []Quiz       `gorm:"foreignKey:SectionID;constraint:OnDelete:CASCADE" json:"quizzes,omitempty"`
	Assignments []Assignment `gorm:"foreignKey:SectionID;constraint:OnDelete:CASCADE" json:"assignments,omitempty"`
}

// Lesson encapsulates study contents.
type Lesson struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TenantID    uint      `gorm:"index:idx_tenant_section,priority:1;not null;default:1" json:"tenant_id"`
	SectionID   uint      `gorm:"index:idx_tenant_section,priority:2;not null" json:"section_id"`
	Title       string    `gorm:"size:150;not null" json:"title"`
	Type        string    `gorm:"size:20;not null" json:"type"` // video, document
	Content     string    `gorm:"type:text" json:"content,omitempty"`
	VideoURL    string    `gorm:"size:255" json:"video_url,omitempty"`
	DocumentURL string    `gorm:"size:255" json:"document_url,omitempty"`
	Duration    int       `gorm:"default:0" json:"duration"` // Duration in seconds
	Order       int       `gorm:"column:sort_order;default:0" json:"order"`
}
