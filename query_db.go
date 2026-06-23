package main

import (
	"fmt"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
)

func main() {
	cfg := config.LoadConfig(".env")
	logger.InitLogger()
	database := db.InitMySQL(cfg)

	var lessons []models.Lesson
	// Query lessons for course 66
	database.Where("section_id IN (SELECT id FROM sections WHERE course_id = ?)", 66).Find(&lessons)

	for _, l := range lessons {
		fmt.Printf("Lesson ID: %d, Title: %s, VideoURL: %s\n", l.ID, l.Title, l.VideoURL)
	}
}
