package models

import (
	"time"
)

// Certificate confirms validation results.
type Certificate struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	TenantID        uint       `gorm:"not null;default:1" json:"tenant_id"`
	EnrollmentID    uint       `gorm:"uniqueIndex;not null" json:"enrollment_id"`
	Enrollment      Enrollment `gorm:"foreignKey:EnrollmentID" json:"enrollment"`
	CertificateCode string     `gorm:"size:50;uniqueIndex:idx_tenant_cert_code;not null" json:"certificate_code"`
	FileURL         string     `gorm:"size:255;not null" json:"file_url"`
	IssuedAt        time.Time  `json:"issued_at"`
}
