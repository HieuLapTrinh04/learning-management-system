package main

import (
	"fmt"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
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

	db.AutoMigrate(&models.Tenant{})

	renderTenant := models.Tenant{
		Name:   "Production System",
		Domain: "lms-backend-api-9cn4.onrender.com",
	}
	if err := db.Where("domain = ?", renderTenant.Domain).FirstOrCreate(&renderTenant).Error; err != nil {
		fmt.Printf("Error: %v\n", err)
	} else {
		fmt.Printf("Tenant created: %s\n", renderTenant.Domain)
	}

	localTenant := models.Tenant{
		Name:   "Local Dev",
		Domain: "localhost:5173",
	}
	db.Where("domain = ?", localTenant.Domain).FirstOrCreate(&localTenant)
	fmt.Printf("Tenant created: %s\n", localTenant.Domain)
}
