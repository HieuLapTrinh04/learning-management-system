package models

import "time"

type Tenant struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:100;not null" json:"name"`
	Domain     string    `gorm:"size:100;not null;uniqueIndex" json:"domain"`
	LogoURL    string    `gorm:"size:255" json:"logo_url"`
	ThemeColor string    `gorm:"size:20;default:'#f59e0b'" json:"theme_color"` // Default brand-500
	IsActive   bool      `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
