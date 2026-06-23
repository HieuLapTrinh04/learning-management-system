package models

import (
	"time"
)

// Enrollment records course ownership access.
type Enrollment struct {
	ID                 uint             `gorm:"primaryKey" json:"id"`
	TenantID           uint             `gorm:"uniqueIndex:idx_tenant_student_course;not null;default:1" json:"tenant_id"`
	StudentID          uint             `gorm:"uniqueIndex:idx_tenant_student_course;not null" json:"student_id"`
	Student            User             `gorm:"foreignKey:StudentID" json:"student"`
	CourseID           uint             `gorm:"uniqueIndex:idx_tenant_student_course;not null" json:"course_id"`
	Course             Course           `gorm:"foreignKey:CourseID" json:"course"`
	ProgressPercentage int              `gorm:"default:0" json:"progress_percentage"`
	EnrolledAt         time.Time        `json:"enrolled_at"`
	CompletedAt        *time.Time       `json:"completed_at,omitempty"`
	LessonProgresses   []LessonProgress `gorm:"foreignKey:EnrollmentID" json:"lesson_progresses,omitempty"`
	Certificate        *Certificate     `gorm:"foreignKey:EnrollmentID" json:"certificate,omitempty"`
}

// LessonProgress stores dynamic completed checks.
type LessonProgress struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	EnrollmentID uint      `gorm:"uniqueIndex:idx_enroll_lesson;not null" json:"enrollment_id"`
	LessonID     uint      `gorm:"uniqueIndex:idx_enroll_lesson;not null" json:"lesson_id"`
	IsCompleted  bool      `gorm:"default:false" json:"is_completed"`
	CompletedAt  time.Time `json:"completed_at"`
}
