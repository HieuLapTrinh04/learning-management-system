package main

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"fmt"
	"math/rand"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/brianvoe/gofakeit/v6"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	logger.Log.Sugar().Infoln("Starting Database Seeder...")

	cfg := config.LoadConfig(".env")
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to connect to MySQL: %v", err)
	}

	// WARNING: This will truncate existing data. In a real environment, you'd add safety checks.
	logger.Log.Sugar().Infoln("Migrating database...")
	err = db.AutoMigrate(
		&models.Tenant{}, &models.User{}, &models.Category{}, &models.Course{},
		&models.Section{}, &models.Lesson{}, &models.Quiz{}, &models.Question{}, &models.Answer{},
		&models.Assignment{}, &models.Enrollment{}, &models.LessonProgress{},
		&models.Order{}, &models.OrderItem{}, &models.Certificate{}, &models.Notification{},
	)
	if err != nil {
		logger.Log.Sugar().Fatalf("Migration failed: %v", err)
	}

	gofakeit.Seed(time.Now().UnixNano())
	rand.Seed(time.Now().UnixNano())

	// 1. Generate 5 Tenants
	logger.Log.Sugar().Infoln("Generating 5 Tenants...")
	var tenants []models.Tenant
	for i := 0; i < 5; i++ {
		tenant := models.Tenant{
			Name:    fmt.Sprintf("%s Academy", gofakeit.Company()),
			Domain:  fmt.Sprintf("%s.edu.vn", gofakeit.DomainName()),
			LogoURL: gofakeit.ImageURL(200, 200),
		}
		db.Create(&tenant)
		tenants = append(tenants, tenant)
	}

	defaultPasswordHash, _ := utils.HashPassword("Password@123")

	// 2. Generate 20 Teachers & 200 Students
	logger.Log.Sugar().Infoln("Generating Users (20 Teachers, 200 Students)...")
	var teachers []models.User
	var students []models.User

	for i := 0; i < 20; i++ {
		tenant := tenants[rand.Intn(len(tenants))]
		teacher := models.User{
			TenantID: tenant.ID,
			Name:     gofakeit.Name(),
			Email:    fmt.Sprintf("teacher%d_%s", i, gofakeit.Email()),
			Password: defaultPasswordHash,
			Role:     "teacher",
			IsActive: true,
		}
		db.Create(&teacher)
		teachers = append(teachers, teacher)
	}

	for i := 0; i < 200; i++ {
		tenant := tenants[rand.Intn(len(tenants))]
		student := models.User{
			TenantID: tenant.ID,
			Name:     gofakeit.Name(),
			Email:    fmt.Sprintf("student%d_%s", i, gofakeit.Email()),
			Password: defaultPasswordHash,
			Role:     "student",
			IsActive: true,
		}
		db.Create(&student)
		students = append(students, student)
	}

	// 3. Generate Categories & 30 Courses
	logger.Log.Sugar().Infoln("Generating 30 Courses with Sections & Categories...")
	var courses []models.Course
	categories := []string{"Web Development", "Data Science", "Mobile Apps", "AI & Machine Learning", "DevOps"}

	for _, tenant := range tenants {
		for _, catName := range categories {
			cat := models.Category{
				TenantID:    tenant.ID,
				Name:        catName,
				Slug:        gofakeit.UUID(),
				Description: gofakeit.Sentence(10),
			}
			db.Create(&cat)
		}
	}

	for i := 0; i < 30; i++ {
		teacher := teachers[rand.Intn(len(teachers))]
		var cat models.Category
		db.Where("tenant_id = ?", teacher.TenantID).First(&cat) // Pick first cat of that tenant

		course := models.Course{
			TenantID:     teacher.TenantID,
			Title:        gofakeit.BookTitle(),
			Slug:         gofakeit.UUID(),
			Subtitle:     gofakeit.Sentence(5),
			Description:  gofakeit.Paragraph(3, 5, 10, "\n"),
			Price:        gofakeit.Price(50000, 2000000),
			ThumbnailURL: gofakeit.ImageURL(800, 450),
			TeacherID:    teacher.ID,
			CategoryID:   cat.ID,
			Status:       "published",
		}
		db.Create(&course)
		courses = append(courses, course)
	}

	// 4. Generate 100 Lessons, 50 Quizzes, 50 Assignments
	logger.Log.Sugar().Infoln("Generating Lessons, Quizzes, and Assignments...")
	var sections []models.Section
	var lessons []models.Lesson
	var quizzes []models.Quiz
	var assignments []models.Assignment

	for _, course := range courses {
		// Each course has 3 sections
		for sIdx := 1; sIdx <= 3; sIdx++ {
			section := models.Section{
				TenantID: course.TenantID,
				CourseID: course.ID,
				Title:    fmt.Sprintf("Module %d: %s", sIdx, gofakeit.BuzzWord()),
				Order:    sIdx,
			}
			db.Create(&section)
			sections = append(sections, section)
		}
	}

	// Distribute 100 lessons
	for i := 0; i < 100; i++ {
		section := sections[rand.Intn(len(sections))]
		lesson := models.Lesson{
			TenantID:  section.TenantID,
			SectionID: section.ID,
			Title:     gofakeit.Sentence(4),
			Type:      "video",
			VideoURL:  "https://www.w3schools.com/html/mov_bbb.mp4",
			Duration:  gofakeit.Number(120, 1800), // 2 to 30 mins
			Order:     i % 5,
		}
		db.Create(&lesson)
		lessons = append(lessons, lesson)
	}

	// Distribute 50 Quizzes
	for i := 0; i < 50; i++ {
		section := sections[rand.Intn(len(sections))]
		quiz := models.Quiz{
			TenantID:  section.TenantID,
			SectionID: section.ID,
			Title:     "Quiz: " + gofakeit.BuzzWord(),
		}
		db.Create(&quiz)
		quizzes = append(quizzes, quiz)
	}

	// Distribute 50 Assignments
	for i := 0; i < 50; i++ {
		section := sections[rand.Intn(len(sections))]
		assignment := models.Assignment{
			TenantID:    section.TenantID,
			SectionID:   section.ID,
			Title:       "Assignment: " + gofakeit.HackerVerb(),
			Description: gofakeit.Paragraph(1, 3, 5, ""),
			MaxScore:    100,
		}
		db.Create(&assignment)
		assignments = append(assignments, assignment)
	}

	// 5. Generate Enrollments, 500 Payments, 300 Certificates
	logger.Log.Sugar().Infoln("Generating Enrollments, Payments, and Certificates...")
	var enrollments []models.Enrollment
	for i := 0; i < 500; i++ {
		student := students[rand.Intn(len(students))]
		// Find a course in the student's tenant
		var validCourses []models.Course
		for _, c := range courses {
			if c.TenantID == student.TenantID {
				validCourses = append(validCourses, c)
			}
		}
		if len(validCourses) == 0 {
			continue
		}
		course := validCourses[rand.Intn(len(validCourses))]

		// Payment (Order)
		order := models.Order{
			TenantID:    student.TenantID,
			StudentID:   student.ID,
			TotalAmount: course.Price,
			Status:      "paid",
			TxnRef:      gofakeit.UUID(),
		}
		db.Create(&order)

		// Order Item
		db.Create(&models.OrderItem{
			TenantID: student.TenantID,
			OrderID:  order.ID,
			CourseID: course.ID,
			Price:    course.Price,
		})

		// Enrollment
		progress := rand.Intn(101) // 0 to 100
		enrollment := models.Enrollment{
			TenantID:           student.TenantID,
			StudentID:          student.ID,
			CourseID:           course.ID,
			ProgressPercentage: progress,
			EnrolledAt:         gofakeit.DateRange(time.Now().AddDate(-1, 0, 0), time.Now()),
		}
		db.Create(&enrollment)
		enrollments = append(enrollments, enrollment)

		// Certificate (if progress == 100), max 300
		if progress >= 80 { // Lowered threshold temporarily to ensure we hit ~300
			db.Create(&models.Certificate{
				TenantID:        student.TenantID,
				EnrollmentID:    enrollment.ID,
				CertificateCode: gofakeit.UUID(),
				IssuedAt:        time.Now(),
				FileURL:         gofakeit.ImageURL(800, 600),
			})
		}
	}

	// 6. Generate 1000 Notifications
	logger.Log.Sugar().Infoln("Generating 1000 Notifications...")
	for i := 0; i < 1000; i++ {
		student := students[rand.Intn(len(students))]
		notification := models.Notification{
			TenantID: student.TenantID,
			UserID:   student.ID,
			Title:    gofakeit.Sentence(3),
			Message:  gofakeit.Sentence(8),
			IsRead:   gofakeit.Bool(),
		}
		db.Create(&notification)
	}

	logger.Log.Sugar().Infoln("✅ Database seeding completed successfully!")
}
