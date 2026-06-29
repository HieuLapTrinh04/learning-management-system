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

	// Delete the newly created admin@lms.com (Soft Delete)
	res := db.Where("email = ?", "admin@lms.com").Delete(&models.User{})
	if res.Error != nil {
		fmt.Printf("Error deleting user: %v\n", res.Error)
	} else {
		fmt.Printf("Successfully deleted %d user(s) with email admin@lms.com\n", res.RowsAffected)
	}
}
