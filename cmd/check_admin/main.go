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

	var users []models.User
	db.Where("email = ?", "admin@lms.com").Find(&users)

	for _, u := range users {
		fmt.Printf("ID: %d, TenantID: %d, Email: %s, IsActive: %t, PasswordHash: %s\n", u.ID, u.TenantID, u.Email, u.IsActive, u.Password)
	}
}
