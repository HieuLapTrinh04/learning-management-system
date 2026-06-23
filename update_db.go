package main

import (
	"log"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
)

func main() {
	cfg := config.LoadConfig(".env")
	logger.InitLogger()
	database := db.InitMySQL(cfg)

	// Backfill final_price and teacher_revenue for old order_items
	err := database.Exec("UPDATE order_items SET final_price = price, teacher_revenue = price * 0.7 WHERE final_price IS NULL OR final_price = 0").Error
	if err != nil {
		log.Println("Error updating order_items:", err)
	}

	log.Println("Update successful!")
}
