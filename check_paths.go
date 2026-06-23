package main

import (
	"fmt"
	"log"

	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
)

func main() {
	dbConn, err := db.ConnectMySQL()
	if err != nil {
		log.Fatal(err)
	}

	var paths []models.LearningPath
	dbConn.Find(&paths)

	fmt.Printf("Total Learning Paths: %d\n", len(paths))
	for _, p := range paths {
		fmt.Printf("ID: %d, Title: %s, TenantID: %d\n", p.ID, p.Title, p.TenantID)
	}
}
