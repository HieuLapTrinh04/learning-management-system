package main

import (
	"fmt"
	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	logger.InitLogger()
	cfg := config.LoadConfig("../../.env")
	mysqlDB := db.InitMySQL(cfg)

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Admin@123"), bcrypt.DefaultCost)
	
	emails := []string{"admin@lms.edu.vn", "student@lms.edu.vn", "teacher@lms.edu.vn"}
	for _, email := range emails {
		err := mysqlDB.Exec("UPDATE users SET password = ? WHERE email = ?", string(hashedPassword), email).Error
		if err != nil {
			fmt.Printf("Error updating %s: %v\n", email, err)
		} else {
			fmt.Printf("Successfully reset password for %s to Admin@123\n", email)
		}
	}
}
