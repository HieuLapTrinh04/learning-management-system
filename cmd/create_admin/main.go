package main

import (
	"fmt"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadConfig("../../.env")
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	if strings.Contains(cfg.DBHost, "tidbcloud.com") {
		dsn += "&tls=true"
	}
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	var tenants []models.Tenant
	if err := db.Find(&tenants).Error; err != nil {
		panic("Could not fetch tenants")
	}

	hashedPassword, _ := utils.HashPassword("Admin@123")

	for _, tenant := range tenants {
		fmt.Printf("Using Tenant: %s (ID: %d)\n", tenant.Name, tenant.ID)

		var adminUser models.User
		err := db.Where("email = ? AND tenant_id = ?", "admin@lms.com", tenant.ID).First(&adminUser).Error
		
		if err == nil {
			// Exists, force update password
			adminUser.Password = hashedPassword
			if err := db.Save(&adminUser).Error; err != nil {
				fmt.Printf("Error updating admin password for tenant %d: %v\n", tenant.ID, err)
			} else {
				fmt.Printf("Admin password updated successfully for %s! Email: admin@lms.com, Password: Admin@123\n\n", tenant.Name)
			}
		} else {
			// Doesn't exist, create
			adminUser = models.User{
				TenantID: tenant.ID,
				Name:     "Super Admin",
				Email:    "admin@lms.com",
				Password: hashedPassword,
				Role:     "admin",
				IsActive: true,
			}
			if err := db.Create(&adminUser).Error; err != nil {
				fmt.Printf("Error creating admin for tenant %d: %v\n", tenant.ID, err)
			} else {
				fmt.Printf("Admin created successfully for %s! Email: admin@lms.com, Password: Admin@123\n\n", tenant.Name)
			}
		}
	}
}
