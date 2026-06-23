package main

import (
	"fmt"
	"log"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
)

func main() {
	// Initialize logger to prevent panic in InitMySQL
	logger.InitLogger()

	cfg := config.LoadConfig(".env")
	mysqlDB := db.InitMySQL(cfg)

	query := `DELETE FROM certificates WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id = 3);`
	err := mysqlDB.Exec(query).Error
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	fmt.Println("Deleted existing certificates for student 3 successfully.")
}
