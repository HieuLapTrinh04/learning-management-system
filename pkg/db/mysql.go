package db

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	gormlogger "gorm.io/gorm/logger"
	"gorm.io/plugin/prometheus"
)

// InitMySQL initializes the GORM MySQL connection and runs auto-migrations.
func InitMySQL(cfg *config.Config) *gorm.DB {
	// First, connect to MySQL server without database name to ensure the database exists
	dsnWithoutDB := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local&timeout=5s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
	)
	tempDB, err := gorm.Open(mysql.Open(dsnWithoutDB), &gorm.Config{})
	if err == nil {
		createSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", cfg.DBName)
		if err := tempDB.Exec(createSQL).Error; err != nil {
			logger.Log.Sugar().Infof("WARNING: Failed to auto-create database %s: %v. Will attempt direct connection.", cfg.DBName, err)
		} else {
			logger.Log.Sugar().Infof("Database '%s' ensured (created if not exists).", cfg.DBName)
		}
		sqlDB, _ := tempDB.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&timeout=5s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Info),
	})
	if err != nil {
		logger.Log.Sugar().Fatalf("Failed to connect to MySQL database: %v", err)
	}

	logger.Log.Sugar().Infoln("Successfully connected to MySQL database!")

	// Use Prometheus Plugin for GORM
	db.Use(prometheus.New(prometheus.Config{
		DBName:          cfg.DBName,
		RefreshInterval: 15,
		MetricsCollector: []prometheus.MetricsCollector{
			&prometheus.MySQL{
				VariableNames: []string{"Threads_running"},
			},
		},
	}))

	// Register Global Tenant Scope
	db.Callback().Query().Before("gorm:query").Register("tenant_isolation", tenantScopeCallback)
	db.Callback().Update().Before("gorm:update").Register("tenant_isolation", tenantScopeCallback)
	db.Callback().Delete().Before("gorm:delete").Register("tenant_isolation", tenantScopeCallback)

	// Run auto-migrations
	err = db.AutoMigrate(
		&models.Tenant{},
		&models.User{},
		&models.Category{},
		&models.Course{},
		&models.Section{},
		&models.Lesson{},
		&models.Enrollment{},
		&models.LessonProgress{},
		&models.Quiz{},
		&models.Question{},
		&models.Answer{},
		&models.QuizAttempt{},
		&models.Assignment{},
		&models.Submission{},
		&models.Order{},
		&models.OrderItem{},
		&models.Certificate{},
		&models.Notification{},
		&models.CartItem{},
		&models.Coupon{},
		&models.CouponUsage{},
		&models.Review{},
		&models.AuditLog{},
		&models.Testimonial{},
		&models.Discussion{},
		&models.Attachment{},
		&models.Note{},
		&models.LearningPath{},
		&models.LearningPathCourse{},
		&models.Badge{},
		&models.UserBadge{},
		&models.Withdrawal{},
		&models.PasswordResetToken{},
		&models.EmailVerificationToken{},
	)
	if err != nil {
		logger.Log.Sugar().Fatalf("Database auto-migration failed: %v", err)
	}

	logger.Log.Sugar().Infoln("Database migration completed successfully!")

	// Multi-tenant backfill script
	migrateDefaultTenant(db)

	// Drop legacy columns that no longer exist in the models (left-over from old schemas)
	legacyCleanups := []struct {
		table  string
		column string
	}{
		{"coupons", "discount_percent"},
	}
	for _, lc := range legacyCleanups {
		var colCount int64
		checkSQL := `SELECT COUNT(*) FROM information_schema.columns 
			WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`
		if err := db.Raw(checkSQL, lc.table, lc.column).Scan(&colCount).Error; err == nil && colCount > 0 {
			if err := db.Exec("ALTER TABLE `" + lc.table + "` DROP COLUMN `" + lc.column + "`").Error; err != nil {
				logger.Log.Sugar().Infof("WARNING: Could not drop legacy column %s.%s: %v", lc.table, lc.column, err)
			} else {
				logger.Log.Sugar().Infof("Dropped legacy column %s.%s", lc.table, lc.column)
			}
		}
	}

	seedData(db)
	return db
}

func migrateDefaultTenant(db *gorm.DB) {
	var count int64
	db.Model(&models.Tenant{}).Where("id = 1").Count(&count)
	if count == 0 {
		defaultTenant := models.Tenant{
			ID:         1,
			Name:       "Lumina Academy",
			Domain:     "localhost", // Can be adjusted by admin later
			ThemeColor: "#f59e0b",
			IsActive:   true,
		}
		if err := db.Create(&defaultTenant).Error; err != nil {
			logger.Log.Sugar().Infof("Failed to create default tenant: %v", err)
		} else {
			logger.Log.Sugar().Infoln("Created default tenant (ID=1).")
		}
	}
}

func seedData(db *gorm.DB) {
	// 1. Seed Categories
	categories := []models.Category{
		{Name: "Web Development", Slug: "web-development", Description: "Lập trình và thiết kế trang web"},
		{Name: "Mobile Development", Slug: "mobile-development", Description: "Phát triển ứng dụng di động"},
		{Name: "Data Science", Slug: "data-science", Description: "Khoa học dữ liệu và phân tích"},
		{Name: "Artificial Intelligence", Slug: "artificial-intelligence", Description: "Trí tuệ nhân tạo và học máy"},
		{Name: "Design", Slug: "design", Description: "Thiết kế đồ họa và UI/UX"},
	}

	for _, cat := range categories {
		var count int64
		db.Model(&models.Category{}).Where("slug = ?", cat.Slug).Count(&count)
		if count == 0 {
			if err := db.Create(&cat).Error; err != nil {
				logger.Log.Sugar().Infof("Failed to seed category %s: %v", cat.Name, err)
			} else {
				logger.Log.Sugar().Infof("Successfully seeded category: %s", cat.Name)
			}
		}
	}

	// 2. Seed Users (Admin, Teacher, Student if not exist)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("securepassword123"), 12)
	if err != nil {
		logger.Log.Sugar().Infof("Failed to hash password for seeding: %v", err)
		return
	}
	passStr := string(hashedPassword)

	users := []models.User{
		{
			Name:     "Quản trị viên",
			Email:    "admin@lms.edu.vn",
			Password: passStr,
			Role:     "admin",
			IsActive: true,
		},
		{
			Name:     "Giảng viên",
			Email:    "teacher@lms.edu.vn",
			Password: passStr,
			Role:     "teacher",
			IsActive: true,
		},
		{
			Name:     "Học viên",
			Email:    "student@lms.edu.vn",
			Password: passStr,
			Role:     "student",
			IsActive: true,
		},
	}

	for _, user := range users {
		var count int64
		db.Model(&models.User{}).Where("email = ?", user.Email).Count(&count)
		if count == 0 {
			if err := db.Create(&user).Error; err != nil {
				logger.Log.Sugar().Infof("Failed to seed user %s: %v", user.Email, err)
			} else {
				logger.Log.Sugar().Infof("Successfully seeded user: %s (%s)", user.Name, user.Role)
			}
		}
	}

	// Seeding Coupons
	coupons := []models.Coupon{
		{
			Code:           "LMS10",
			DiscountType:   "percentage",
			DiscountValue:  10,
			MinOrderAmount: 0,
			MaxDiscount:    50000,
			Scope:          "global",
			ExpiryDate:     time.Now().AddDate(1, 0, 0),
			UsageLimit:     1000,
			UserLimit:      1,
			IsActive:       true,
		},
		{
			Code:           "GIARE50",
			DiscountType:   "percentage",
			DiscountValue:  50,
			MinOrderAmount: 100000,
			MaxDiscount:    200000,
			Scope:          "global",
			ExpiryDate:     time.Now().AddDate(1, 0, 0),
			UsageLimit:     500,
			UserLimit:      1,
			IsActive:       true,
		},
		{
			Code:           "LMS50K",
			DiscountType:   "fixed",
			DiscountValue:  50000,
			MinOrderAmount: 150000,
			MaxDiscount:    50000,
			Scope:          "global",
			ExpiryDate:     time.Now().AddDate(1, 0, 0),
			UsageLimit:     200,
			UserLimit:      1,
			IsActive:       true,
		},
	}

	for _, cp := range coupons {
		var count int64
		db.Model(&models.Coupon{}).Where("code = ?", cp.Code).Count(&count)
		if count == 0 {
			if err := db.Create(&cp).Error; err != nil {
				logger.Log.Sugar().Infof("Failed to seed coupon %s: %v", cp.Code, err)
			} else {
				logger.Log.Sugar().Infof("Successfully seeded coupon: %s (Type: %s, Value: %.2f)", cp.Code, cp.DiscountType, cp.DiscountValue)
			}
		}
	}

	// 3. Seed Courses (if not exist)
	var count1 int64
	db.Model(&models.Course{}).Where("slug = ?", "golang-microservices-with-fiber").Count(&count1)
	if count1 == 0 {
		course1 := models.Course{
			Title:        "Golang Microservices with Fiber",
			Slug:         "golang-microservices-with-fiber",
			Subtitle:     "Deep dive into GORM, Redis, and VNPay Payment Integration",
			Description:  "Khóa học chuyên sâu hướng dẫn thiết kế hệ thống Microservices sử dụng Golang Fiber, GORM, Redis kết hợp các tính năng thanh toán VNPay nâng cao.",
			Price:        499000,
			TeacherID:    2, // Giảng viên
			CategoryID:   1, // Web Development
			Status:       "published",
			ThumbnailURL: "https://res.cloudinary.com/demo/image/upload/v1625078000/sample.jpg",
		}
		if err := db.Create(&course1).Error; err == nil {
			logger.Log.Sugar().Infof("Successfully seeded course: %s", course1.Title)
			// Seed Sections for course 1
			sec1 := models.Section{CourseID: course1.ID, Title: "Chương 1: Khởi tạo Project & Routing", Order: 1}
			sec2 := models.Section{CourseID: course1.ID, Title: "Chương 2: Tích hợp Database GORM & Redis", Order: 2}
			db.Create(&sec1)
			db.Create(&sec2)

			// Seed Lessons for sections
			les1 := models.Lesson{SectionID: sec1.ID, Title: "1.1 Giới thiệu cấu trúc Golang Fiber", Type: "video", VideoURL: "https://res.cloudinary.com/demo/video/upload/sample.mp4", Duration: 300, Order: 1}
			les2 := models.Lesson{SectionID: sec1.ID, Title: "1.2 Xây dựng REST API Router", Type: "video", VideoURL: "https://res.cloudinary.com/demo/video/upload/sample.mp4", Duration: 450, Order: 2}
			les3 := models.Lesson{SectionID: sec2.ID, Title: "2.1 Kết nối MySQL qua GORM AutoMigrate", Type: "video", VideoURL: "https://res.cloudinary.com/demo/video/upload/sample.mp4", Duration: 600, Order: 1}
			db.Create(&les1)
			db.Create(&les2)
			db.Create(&les3)
		} else {
			logger.Log.Sugar().Infof("Failed to seed course 1: %v", err)
		}
	} else {
		db.Model(&models.Course{}).Where("slug = ?", "golang-microservices-with-fiber").Update("status", "published")
	}

	var count2 int64
	db.Model(&models.Course{}).Where("slug = ?", "lap-trinh-frontend-reactjs-co-ban").Count(&count2)
	if count2 == 0 {
		course2 := models.Course{
			Title:        "Lập trình Frontend ReactJS cơ bản",
			Slug:         "lap-trinh-frontend-reactjs-co-ban",
			Subtitle:     "Học React, Redux Toolkit và TailwindCSS thực chiến",
			Description:  "Khóa học giúp bạn nắm vững các kiến thức cơ bản của ReactJS để tự xây dựng các ứng dụng Single Page cao cấp.",
			Price:        0, // Miễn phí
			TeacherID:    2, // Giảng viên
			CategoryID:   1, // Web Development
			Status:       "published",
			ThumbnailURL: "https://res.cloudinary.com/demo/image/upload/v1625078000/sample.jpg",
		}
		if err := db.Create(&course2).Error; err == nil {
			logger.Log.Sugar().Infof("Successfully seeded course: %s", course2.Title)
			sec3 := models.Section{CourseID: course2.ID, Title: "Chương 1: Giới thiệu React Hooks", Order: 1}
			db.Create(&sec3)
			les4 := models.Lesson{SectionID: sec3.ID, Title: "1.1 Cơ chế hoạt động của useState và useEffect", Type: "video", VideoURL: "https://res.cloudinary.com/demo/video/upload/sample.mp4", Duration: 350, Order: 1}
			db.Create(&les4)
		} else {
			logger.Log.Sugar().Infof("Failed to seed course 2: %v", err)
		}
	} else {
		db.Model(&models.Course{}).Where("slug = ?", "lap-trinh-frontend-reactjs-co-ban").Update("status", "published")
	}


	// Seed Review if Course #1 and Student #3 exist
	var courseCount int64
	var studentCount int64
	db.Model(&models.Course{}).Where("id = ?", 1).Count(&courseCount)
	db.Model(&models.User{}).Where("id = 3").Count(&studentCount)

	if courseCount > 0 && studentCount > 0 {
		// Seed Review
		var reviewCount int64
		db.Model(&models.Review{}).Where("course_id = ?", 1).Count(&reviewCount)
		if reviewCount == 0 {
			dummyReview := models.Review{
				TenantID:  1,
				StudentID: 3, // Học viên
				CourseID:  1,
				Rating:    5,
				Comment:   "Khóa học rất chất lượng, giảng viên giải thích chi tiết dễ hiểu. Đáng tiền!",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}
			db.Create(&dummyReview)
			logger.Log.Sugar().Infoln("Successfully seeded initial course review!")
		}
		
		// Seed Order and Enrollment to populate Dashboard Stats
		var orderCount int64
		db.Model(&models.Order{}).Where("student_id = ?", 3).Count(&orderCount)
		if orderCount == 0 {
			now := time.Now()
			dummyOrder := models.Order{
				TenantID:       1,
				StudentID:      3,
				TotalAmount:    499000,
				Status:         "paid",
				TxnRef:         "VNPay_Seed_9999",
				CreatedAt:      now.AddDate(0, -1, 0), // 1 month ago to show in chart
				PaidAt:         &now,
				DiscountAmount: 0,
				OrderItems: []models.OrderItem{
					{TenantID: 1, CourseID: 1, Price: 499000},
				},
			}
			db.Create(&dummyOrder)
			
			dummyEnrollment := models.Enrollment{
				TenantID:           1,
				StudentID:          3,
				CourseID:           1,
				ProgressPercentage: 100,
				EnrolledAt:         now.AddDate(0, -1, 0),
				CompletedAt:        &now,
			}
			db.Create(&dummyEnrollment)
			
			dummyCert := models.Certificate{
				TenantID:        1,
				EnrollmentID:    dummyEnrollment.ID,
				CertificateCode: "CERT-SEED-2026",
				FileURL:         "https://res.cloudinary.com/demo/image/upload/v1625078000/sample_cert.pdf",
				IssuedAt:        now,
			}
			db.Create(&dummyCert)
			logger.Log.Sugar().Infoln("Successfully seeded Order, Enrollment, and Certificate!")
		}
	}
}

func tenantScopeCallback(db *gorm.DB) {
	tenantID, ok := db.Statement.Context.Value("tenantID").(uint)
	if ok && tenantID > 0 && db.Statement.Schema != nil {
		if _, hasTenant := db.Statement.Schema.FieldsByName["TenantID"]; hasTenant {
			db.Statement.AddClause(clause.Where{Exprs: []clause.Expression{
				clause.Eq{Column: clause.Column{Table: db.Statement.Schema.Table, Name: "tenant_id"}, Value: tenantID},
			}})
		}
	}
}
