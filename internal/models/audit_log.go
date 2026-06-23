package models

import "time"

type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  uint      `gorm:"not null;default:1" json:"tenant_id"`
	UserID    *uint     `gorm:"index" json:"user_id"` // Nullable for system events
	Action    string    `gorm:"size:100;not null;index" json:"action"`
	Entity    string    `gorm:"size:100;not null;index" json:"entity"`
	EntityID  *uint     `json:"entity_id"`
	Details   string    `gorm:"type:text" json:"details"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`

	// Associations
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
