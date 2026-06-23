package models

import (
	"time"
)

// Quiz marks structured multiple choice checkpoints.
type Quiz struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	TenantID     uint       `gorm:"not null;default:1" json:"tenant_id"`
	SectionID    uint       `gorm:"not null" json:"section_id"`
	Title        string     `gorm:"size:150;not null" json:"title"`
	PassingScore int        `gorm:"default:80" json:"passing_score"` // In percentage
	MaxAttempts  int        `gorm:"default:3" json:"max_attempts"`
	Duration     int        `gorm:"default:15" json:"duration"`      // In minutes
	Questions    []Question    `gorm:"foreignKey:QuizID;constraint:OnDelete:CASCADE" json:"questions,omitempty"`
	Attempts     []QuizAttempt `gorm:"-" json:"attempts,omitempty"`
}

// Question represents a quiz query item.
type Question struct {
	ID           uint     `gorm:"primaryKey" json:"id"`
	TenantID     uint     `gorm:"not null;default:1" json:"tenant_id"`
	QuizID       uint     `gorm:"not null" json:"quiz_id"`
	QuestionText string   `gorm:"type:text;not null" json:"question_text"`
	Type         string   `gorm:"size:20;default:'single'" json:"type"` // single, multiple
	Answers      []Answer `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE" json:"answers,omitempty"`
}

// Answer houses choices.
type Answer struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	TenantID   uint   `gorm:"not null;default:1" json:"tenant_id"`
	QuestionID uint   `gorm:"not null" json:"question_id"`
	AnswerText string `gorm:"size:255;not null" json:"answer_text"`
	IsCorrect  bool   `gorm:"default:false" json:"-"` // Omit correct answer from student view
}

// QuizAttempt tracks evaluation details.
type QuizAttempt struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TenantID    uint      `gorm:"not null;default:1" json:"tenant_id"`
	StudentID   uint      `gorm:"not null" json:"student_id"`
	QuizID      uint      `gorm:"not null" json:"quiz_id"`
	Score       int       `json:"score"` // Scored percentage
	IsPassed    bool      `json:"is_passed"`
	AttemptedAt time.Time `json:"attempted_at"`
}

// Assignment handles manual submission instructions.
type Assignment struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TenantID    uint      `gorm:"not null;default:1" json:"tenant_id"`
	SectionID   uint      `gorm:"not null" json:"section_id"`
	Title       string    `gorm:"size:150;not null" json:"title"`
	Description string    `gorm:"type:text;not null" json:"description"`
	FileURL     string    `gorm:"size:255" json:"file_url"` // Template file
	MaxScore    int       `gorm:"default:10" json:"max_score"`
	DueDate     time.Time `json:"due_date"`
}

// Submission stores file answers.
type Submission struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	TenantID     uint       `gorm:"not null;default:1" json:"tenant_id"`
	AssignmentID uint       `gorm:"not null" json:"assignment_id"`
	StudentID    uint       `gorm:"not null" json:"student_id"`
	Student      User       `gorm:"foreignKey:StudentID" json:"student"`
	FileURL      string     `gorm:"size:255;not null" json:"file_url"`
	Score        *int       `json:"score,omitempty"` // Nullable if not graded yet
	Feedback     string     `gorm:"type:text" json:"feedback,omitempty"`
	GradedBy     *uint      `json:"graded_by,omitempty"`
	SubmittedAt  time.Time  `json:"submitted_at"`
	GradedAt     *time.Time `json:"graded_at,omitempty"`
}
