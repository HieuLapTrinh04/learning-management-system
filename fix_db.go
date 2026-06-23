package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/lms_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	res, err := db.Exec("UPDATE learning_paths SET tenant_id = 1 WHERE tenant_id = 0")
	if err != nil {
		log.Fatal(err)
	}
	affected, _ := res.RowsAffected()
	fmt.Printf("Fixed %d paths\n", affected)
}
