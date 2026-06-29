package main
import (
	"context"
	"fmt"
	"log"
	"learning-management-system/internal/config"
	"learning-management-system/internal/repository"
	"learning-management-system/pkg/database"
)
func main() {
	cfg := config.LoadConfig()
	db, err := database.InitMySQL(cfg.MySQLDSN)
	if err != nil { log.Fatal(err) }
	repo := repository.NewDashboardRepository(db)
	stats, err := repo.GetStudentStats(context.Background(), 3)
	if err != nil { fmt.Printf("ERROR: %v\n", err) } else { fmt.Printf("SUCCESS: %+v\n", stats) }
}
