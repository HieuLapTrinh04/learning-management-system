package models

import "time"

type EmailVerificationToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1" json:"tenant_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Token     string    `gorm:"size:255;not null;unique" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type PasswordResetToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1" json:"tenant_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Token     string    `gorm:"size:255;not null;unique" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
