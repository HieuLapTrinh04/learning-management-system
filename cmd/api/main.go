package main

import (
	"context"
	"encoding/json"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/delivery/http"
	"github.com/HieuLapTrinh04/learning-management-system/internal/delivery/http/handlers"
	"github.com/HieuLapTrinh04/learning-management-system/internal/delivery/http/ws"
	"github.com/HieuLapTrinh04/learning-management-system/internal/middleware"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/db"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
	"github.com/ansrivas/fiberprometheus/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func main() {
	// Initialize centralized logger
	logger.InitLogger()
	defer logger.Sync()

	logger.Log.Info("Starting Online Learning Management System Backend...")

	// err := sentry.Init(sentry.ClientOptions{
	// 	Dsn: os.Getenv("SENTRY_DSN"),
	// 	EnableTracing: true,
	// 	TracesSampleRate: 1.0,
	// })
	// if err != nil {
	// 	logger.Log.Sugar().Fatalf("sentry.Init: %s", err)
	// }
	// defer sentry.Flush(2 * time.Second)
	// Ensure uploads fallback directories exist
	if err := os.MkdirAll("./uploads/certificates", 0755); err != nil {
		logger.Log.Sugar().Infof("WARNING: Failed to create uploads/certificates fallback directory: %v", err)
	}

	// 1. Load Configurations
	cfg := config.LoadConfig(".env")

	// 2. Initialize Database Connections
	mysqlDB := db.InitMySQL(cfg)
	redisClient := db.InitRedis(cfg)

	// 3. Initialize Repositories
	userRepo := repository.NewUserRepository(mysqlDB)
	categoryRepo := repository.NewCategoryRepository(mysqlDB)
	courseRepo := repository.NewCourseRepository(mysqlDB)
	sectionRepo := repository.NewSectionRepository(mysqlDB)
	lessonRepo := repository.NewLessonRepository(mysqlDB)
	enrollmentRepo := repository.NewEnrollmentRepository(mysqlDB)
	quizRepo := repository.NewQuizRepository(mysqlDB)
	assignmentRepo := repository.NewAssignmentRepository(mysqlDB)
	paymentRepo := repository.NewPaymentRepository(mysqlDB)
	certRepo := repository.NewCertificateRepository(mysqlDB)
	notificationRepo := repository.NewNotificationRepository(mysqlDB)
	tokenRepo := repository.NewTokenRepository(mysqlDB)
	dashboardRepo := repository.NewDashboardRepository(mysqlDB)
	cartRepo := repository.NewCartRepository(mysqlDB)
	couponRepo := repository.NewCouponRepository(mysqlDB)
	reviewRepo := repository.NewReviewRepository(mysqlDB)
	auditLogRepo := repository.NewAuditLogRepository(mysqlDB)
	testimonialRepo := repository.NewTestimonialRepository(mysqlDB)
	discussionRepo := repository.NewDiscussionRepository(mysqlDB)
	attachmentRepo := repository.NewAttachmentRepository(mysqlDB)
	noteRepo := repository.NewNoteRepository(mysqlDB)
	pathRepo := repository.NewLearningPathRepository(mysqlDB)
	gamificationRepo := repository.NewGamificationRepository(mysqlDB)

	// Initialize Utils
	emailSvc := utils.NewEmailService(cfg.ResendAPIKey, cfg.EmailFromAddress)

	// Initialize Storage Client (Cloudinary)
	storageClient, err := utils.NewStorageClient(cfg)
	if err != nil {
		logger.Log.Sugar().Infof("WARNING: Storage Client (Cloudinary) failed to initialize: %v. Assignment uploads will fail.", err)
	}

	// 4. Initialize Core Services
	wsHub := ws.NewHub(redisClient)
	go wsHub.Run()

	// Start Redis Subscriber loop for notifications channel
	go func() {
		pubsub := redisClient.Subscribe(context.Background(), "lms_notifications")
		defer pubsub.Close()

		ch := pubsub.Channel()
		for msg := range ch {
			var notification models.Notification
			err := json.Unmarshal([]byte(msg.Payload), &notification)
			if err != nil {
				logger.Log.Sugar().Infof("Failed to unmarshal published Redis notification payload: %v", err)
				continue
			}

			// Forward payload to correct student via WS
			wsHub.Broadcast(notification.UserID, []byte(msg.Payload))
		}
	}()

	// 4. Initialize UseCases (Business Logic)
	auditSvc := usecase.NewAuditLogUseCase(auditLogRepo)
	auditSvc.RunRetentionCron(90) // Keep logs for 90 days

	authUseCase := usecase.NewAuthUseCase(userRepo, tokenRepo, redisClient, cfg, emailSvc, auditSvc)
	categoryUseCase := usecase.NewCategoryUseCase(categoryRepo)
	courseUseCase := usecase.NewCourseUseCase(courseRepo, sectionRepo, lessonRepo, auditSvc)
	notificationUseCase := usecase.NewNotificationUseCase(notificationRepo, redisClient)
	gamificationUseCase := usecase.NewGamificationUseCase(gamificationRepo, userRepo, notificationUseCase)
	enrollmentUseCase := usecase.NewEnrollmentUseCase(enrollmentRepo, courseRepo, lessonRepo, sectionRepo, notificationUseCase, gamificationUseCase)
	quizUseCase := usecase.NewQuizUseCase(quizRepo, sectionRepo, courseRepo, enrollmentRepo, notificationUseCase)
	assignmentUseCase := usecase.NewAssignmentUseCase(assignmentRepo, sectionRepo, courseRepo, enrollmentRepo, storageClient, notificationUseCase, emailSvc, auditSvc)
	assignmentUseCase.RunOverdueGradingCron(60) // Run every 60 minutes
	
	paymentUseCase := usecase.NewPaymentUseCase(paymentRepo, courseRepo, enrollmentRepo, userRepo, notificationUseCase, emailSvc, auditSvc, cfg)
	certUseCase := usecase.NewCertificateUseCase(certRepo, enrollmentRepo, storageClient, notificationUseCase, emailSvc, cfg)
	dashboardUseCase := usecase.NewDashboardUseCase(dashboardRepo, redisClient)
	couponUseCase := usecase.NewCouponUseCase(couponRepo, courseRepo)
	cartUseCase := usecase.NewCartUseCase(cartRepo, courseRepo, enrollmentRepo, paymentRepo, couponUseCase, cfg)
	reviewUseCase := usecase.NewReviewUseCase(reviewRepo, courseRepo, enrollmentRepo)
	testimonialUseCase := usecase.NewTestimonialUseCase(testimonialRepo)
	userUseCase := usecase.NewUserUseCase(userRepo)
	discussionUseCase := usecase.NewDiscussionUseCase(discussionRepo, lessonRepo)
	attachmentUseCase := usecase.NewAttachmentUseCase(attachmentRepo, lessonRepo)
	noteUseCase := usecase.NewNoteUseCase(noteRepo)
	pathUseCase := usecase.NewLearningPathUseCase(pathRepo)

	// Wire Auto Certificate Generation Hooks
	enrollmentUseCase.SetAutoCertifier(certUseCase.TriggerAutoCertificateAsync)
	quizUseCase.SetAutoCertifier(certUseCase.TriggerAutoCertificateAsync)
	assignmentUseCase.SetAutoCertifier(certUseCase.TriggerAutoCertificateAsync)

	// 5. Initialize HTTP Handlers
	authHandler := handlers.NewAuthHandler(authUseCase, cfg)
	categoryHandler := handlers.NewCategoryHandler(categoryUseCase)
	courseHandler := handlers.NewCourseHandler(courseUseCase, storageClient)
	enrollmentHandler := handlers.NewEnrollmentHandler(enrollmentUseCase)
	quizHandler := handlers.NewQuizHandler(quizUseCase)
	assignmentHandler := handlers.NewAssignmentHandler(assignmentUseCase)
	paymentHandler := handlers.NewPaymentHandler(paymentUseCase)
	certificateHandler := handlers.NewCertificateHandler(certUseCase)
	notificationHandler := handlers.NewNotificationHandler(notificationUseCase, wsHub)
	dashboardHandler := handlers.NewDashboardHandler(dashboardUseCase)
	cartHandler := handlers.NewCartHandler(cartUseCase)
	couponHandler := handlers.NewCouponHandler(couponUseCase)
	reviewHandler := handlers.NewReviewHandler(reviewUseCase)
	auditLogHandler := handlers.NewAuditLogHandler(auditSvc)
	tenantHandler := handlers.NewTenantHandler(mysqlDB)
	testimonialHandler := handlers.NewTestimonialHandler(testimonialUseCase)
	userHandler := handlers.NewUserHandler(userUseCase, storageClient)
	discussionHandler := handlers.NewDiscussionHandler(discussionUseCase)
	attachmentHandler := handlers.NewAttachmentHandler(attachmentUseCase)
	noteHandler := handlers.NewNoteHandler(noteUseCase)
	pathHandler := handlers.NewLearningPathHandler(pathUseCase)
	gamificationHandler := handlers.NewGamificationHandler(gamificationUseCase)

	// 6. Initialize Fiber App with Global Error Handler
	app := fiber.New(fiber.Config{
		AppName:      "Online LMS API Server",
		ErrorHandler: middleware.GlobalErrorHandler,
		BodyLimit:    50 * 1024 * 1024,
	})

	// Setup Prometheus Metrics
	prometheus := fiberprometheus.New("lms_backend")
	prometheus.RegisterAt(app, "/metrics")
	app.Use(prometheus.Middleware)

	// Enable CORS for frontend integration
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,http://127.0.0.1:5173"
	}
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     allowedOrigins, // E.g., "https://lms.edu.vn,http://localhost:5173"
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Tenant-Domain",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Global Rate Limiting Middleware
	app.Use(limiter.New(limiter.Config{
		Max:        100,             // Max 100 requests per IP
		Expiration: 1 * time.Minute, // Per 1 minute window
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"type":    "RateLimitExceeded",
					"message": "Too many requests, please try again later.",
				},
			})
		},
	}))

	// Multi-tenant Middleware
	app.Use(middleware.TenantResolver(mysqlDB))

	// 7. Setup Routing
	http.SetupRoutes(app, authHandler, categoryHandler, courseHandler, enrollmentHandler, quizHandler, assignmentHandler, paymentHandler, cartHandler, couponHandler, reviewHandler, certificateHandler, notificationHandler, dashboardHandler,
		auditLogHandler,
		tenantHandler,
		testimonialHandler,
		userHandler,
		discussionHandler,
		attachmentHandler,
		noteHandler,
		pathHandler,
		gamificationHandler,
		cfg,
	)

	// 8. Setup Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		logger.Log.Sugar().Infoln("Gracefully shutting down the server...")
		if err := app.ShutdownWithTimeout(10 * time.Second); err != nil {
			logger.Log.Sugar().Infof("Error during server shutdown: %v", err)
		}
	}()

	// 9. Start HTTP Server
	logger.Log.Sugar().Infof("LMS Server is starting on port %s in %s mode...", cfg.Port, cfg.Env)
	if err := app.Listen(":" + cfg.Port); err != nil {
		logger.Log.Sugar().Fatalf("Server failed to start: %v", err)
	}

	logger.Log.Sugar().Infoln("Server was successfully shutdown.")
}
