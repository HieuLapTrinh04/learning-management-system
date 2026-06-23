package main

import (
	"fmt"
	"log"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
)

func main() {
	cfg := config.LoadConfig(".env")
	mysqlDB := db.InitMySQL(cfg)

	query := `
		SELECT a.tenant_id, a.id, e.student_id, a.due_date, NOW()
		FROM assignments a
		JOIN sections s ON a.section_id = s.id
		JOIN enrollments e ON s.course_id = e.course_id
		LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = e.student_id
		WHERE a.due_date < NOW() AND sub.id IS NULL
	`
	rows, err := mysqlDB.Raw(query).Rows()
	if err != nil {
		log.Fatalf("Error running query: %v", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		count++
		var tenantID, id, studentID int
		var dueDate, now string
		rows.Scan(&tenantID, &id, &studentID, &dueDate, &now)
		fmt.Printf("Found: tenant=%d, assignment=%d, student=%d, due=%s, now=%s\n", tenantID, id, studentID, dueDate, now)
	}
	fmt.Printf("Total rows: %d\n", count)
}
