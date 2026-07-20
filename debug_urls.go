package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "root:123456@tcp(127.0.0.1:3306)/lms_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error opening db: %v", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatalf("Error pinging db: %v", err)
	}

	rows, err := db.Query("SELECT id, title, video_url FROM lessons")
	if err != nil {
		log.Fatalf("Error querying lessons: %v", err)
	}
	defer rows.Close()

	fmt.Println("=== Lesson URLs ===")
	for rows.Next() {
		var id int
		var title string
		var url sql.NullString
		if err := rows.Scan(&id, &title, &url); err != nil {
			log.Fatal(err)
		}
		
		val := "NULL"
		if url.Valid {
			val = url.String
		}
		fmt.Printf("ID: %d | Title: %s | URL: %s\n", id, title, val)
	}
}
