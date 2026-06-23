package models

import "time"

// Review represents student ratings and comments on a course, with optional teacher reply.
type Review struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	TenantID  uint       `gorm:"uniqueIndex:idx_tenant_student_course_review;not null;default:1" json:"tenant_id"`
	StudentID uint       `gorm:"uniqueIndex:idx_tenant_student_course_review;not null" json:"student_id"`
	Student   User       `gorm:"foreignKey:StudentID" json:"student"`
	CourseID  uint       `gorm:"uniqueIndex:idx_tenant_student_course_review;not null" json:"course_id"`
	Course    Course     `gorm:"foreignKey:CourseID" json:"-"`
	Rating    int        `gorm:"not null" json:"rating"` // Scale 1 to 5
	Comment   string     `gorm:"type:text;not null" json:"comment"`
	Reply     string     `gorm:"type:text" json:"reply"`
	RepliedAt *time.Time `json:"replied_at,omitempty"`
	IsHidden  bool       `gorm:"default:false" json:"is_hidden"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
