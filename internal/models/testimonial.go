package models

import "time"

// Testimonial represents a platform review/success story shown on the Landing Page.
type Testimonial struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1;index" json:"tenant_id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Role      string    `gorm:"size:100" json:"role"`
	AvatarURL string    `gorm:"size:255" json:"avatar_url"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Rating    int       `gorm:"not null;default:5" json:"rating"` // Scale 1 to 5
	IsActive  bool      `gorm:"default:true;index" json:"is_active"`
	SortOrder int       `gorm:"default:0;index" json:"sort_order"` // For custom ordering
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
