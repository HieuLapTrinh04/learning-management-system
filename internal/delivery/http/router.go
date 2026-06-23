package http

import (
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/delivery/http/handlers"
	"github.com/HieuLapTrinh04/learning-management-system/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/websocket/v2"
)

func SetupRoutes(
	app *fiber.App,
	authHandler *handlers.AuthHandler,
	categoryHandler *handlers.CategoryHandler,
	courseHandler *handlers.CourseHandler,
	enrollmentHandler *handlers.EnrollmentHandler,
	quizHandler *handlers.QuizHandler,
	assignmentHandler *handlers.AssignmentHandler,
	paymentHandler *handlers.PaymentHandler,
	cartHandler *handlers.CartHandler,
	couponHandler *handlers.CouponHandler,
	reviewHandler *handlers.ReviewHandler,
	certificateHandler *handlers.CertificateHandler,
	notificationHandler *handlers.NotificationHandler,
	dashboardHandler *handlers.DashboardHandler,
	auditLogHandler *handlers.AuditLogHandler,
	tenantHandler *handlers.TenantHandler,
	testimonialHandler *handlers.TestimonialHandler,
	userHandler *handlers.UserHandler,
	discussionHandler *handlers.DiscussionHandler,
	attachmentHandler *handlers.AttachmentHandler,
	noteHandler *handlers.NoteHandler,
	pathHandler *handlers.LearningPathHandler,
	gamificationHandler *handlers.GamificationHandler,
	cfg *config.Config,
) {
	// Global middleware
	app.Use(logger.New())

	// Serve static uploads
	app.Static("/uploads", "./uploads")

	// API versioning group
	api := app.Group("/api/v1")

	// Health check endpoint for Docker Compose and monitoring
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"status":  "ok",
			"message": "API Server is running smoothly.",
		})
	})

	// Tenant info endpoint
	api.Get("/tenant", tenantHandler.GetCurrentTenant)

	// User Profile
	users := api.Group("/users", middleware.AuthRequired(cfg))
	users.Get("/me", userHandler.GetMe)
	users.Put("/me", userHandler.UpdateProfile)
	users.Get("/me/gamification", gamificationHandler.GetMyProfile)
	users.Post("/upload-avatar", middleware.UploadSecurity(5*1024*1024, []string{"image/jpeg", "image/png", "image/webp"}, "avatar"), userHandler.UploadAvatar)

	// 1. Auth public endpoints
	// Protect Auth routes against Brute Force attacks (max 5 requests per minute per IP)
	auth := api.Group("/auth", limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too many failed attempts. Please try again later.",
			})
		},
	}))
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authHandler.Logout)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Get("/verify-email", authHandler.VerifyEmail)
	auth.Post("/forgot-password", authHandler.ForgotPassword)
	auth.Post("/reset-password", authHandler.ResetPassword)

	// 2. Public Browse endpoints (Categories & Courses Catalog)
	api.Get("/categories", categoryHandler.List)
	api.Get("/categories/:id", categoryHandler.GetByID)
	api.Get("/courses", courseHandler.SearchCourses)
	api.Get("/courses/:idOrSlug", courseHandler.GetCourseDetails)
	api.Get("/courses/:courseId/reviews", reviewHandler.GetCourseReviews)
	api.Get("/testimonials", testimonialHandler.GetPublic)

	// Public Learning Paths
	api.Get("/learning-paths", pathHandler.ListAll)
	api.Get("/learning-paths/:id", pathHandler.GetByID)

	// Public Leaderboard
	api.Get("/leaderboard", gamificationHandler.GetLeaderboard)

	// Public payment callbacks
	api.Get("/payments/vnpay-ipn", paymentHandler.HandleIPN)
	api.Get("/payments/vnpay-return", paymentHandler.HandleReturn)

	// Public certificate verification
	api.Get("/certificates/verify/:code", certificateHandler.VerifyCertificate)

	// WebSocket ticket generation (Normal HTTP)
	api.Get("/ws/ticket", middleware.AuthRequired(cfg), notificationHandler.GenerateWSTicket)

	// WebSocket routes with upgrade check
	api.Use("/ws/notifications", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	api.Get("/ws/notifications", notificationHandler.WebSocketEndpoint())

	// Authenticated General Endpoints (all logged-in roles)
	authRequired := api.Group("", middleware.AuthRequired(cfg))
	authRequired.Get("/notifications", notificationHandler.List)
	authRequired.Put("/notifications/:id/read", notificationHandler.MarkAsRead)
	authRequired.Put("/notifications/read-all", notificationHandler.MarkAllAsRead)

	// Discussion (Q&A) Endpoints
	authRequired.Get("/lessons/:lessonId/discussions", discussionHandler.GetDiscussions)
	authRequired.Post("/lessons/:lessonId/discussions", discussionHandler.CreateDiscussion)
	authRequired.Delete("/discussions/:id", discussionHandler.DeleteDiscussion)

	// Attachment Endpoints
	authRequired.Get("/lessons/:lessonId/attachments", attachmentHandler.GetAttachments)

	// Note Endpoints
	authRequired.Get("/lessons/:lessonId/notes", noteHandler.ListByLesson)
	authRequired.Post("/lessons/:lessonId/notes", noteHandler.Create)
	authRequired.Put("/notes/:id", noteHandler.Update)
	authRequired.Delete("/notes/:id", noteHandler.Delete)

	// 3. Admin Protected Endpoints
	admin := api.Group("/admin", middleware.AuthRequired(cfg), middleware.RolesAllowed("admin"))
	admin.Post("/categories", categoryHandler.Create)
	admin.Put("/categories/:id", categoryHandler.Update)
	admin.Delete("/categories/:id", categoryHandler.Delete)
	admin.Get("/courses", courseHandler.GetAdminCourses)
	admin.Put("/courses/:id/status", courseHandler.PublishCourse) // Admin can publish/approve courses directly
	admin.Get("/dashboard/analytics", dashboardHandler.GetAdminAnalytics)
	admin.Get("/payments/transactions", paymentHandler.AdminListTransactions)
	admin.Get("/payments/export", paymentHandler.AdminExportTransactions)

	// Admin Withdrawals
	admin.Get("/withdrawals", paymentHandler.GetAdminWithdrawals)
	admin.Put("/withdrawals/:id/status", paymentHandler.UpdateWithdrawalStatus)
	admin.Post("/payments/orders/:id/refund", paymentHandler.AdminRefundOrder)
	admin.Get("/coupons", couponHandler.ListCoupons)
	admin.Post("/coupons", couponHandler.CreateCoupon)
	admin.Put("/coupons/:id", couponHandler.UpdateCoupon)
	admin.Put("/coupons/:id/status", couponHandler.ToggleCouponStatus)
	admin.Post("/coupons/:id/expire", couponHandler.ExpireCoupon)
	admin.Get("/reviews", reviewHandler.AdminListAllReviews)
	admin.Put("/reviews/:id/moderate", reviewHandler.ModerateReview)
	admin.Get("/audit-logs", auditLogHandler.GetLogs)

	// User Management
	admin.Get("/users", userHandler.GetAdminUsers)
	admin.Put("/users/:id/status", userHandler.UpdateUserStatus)
	admin.Put("/users/:id/role", userHandler.UpdateUserRole)
	admin.Delete("/users/:id", userHandler.DeleteUser)

	// Testimonial management
	admin.Get("/testimonials", testimonialHandler.GetAdmin)
	admin.Post("/testimonials", testimonialHandler.Create)
	admin.Put("/testimonials/:id", testimonialHandler.Update)
	admin.Delete("/testimonials/:id", testimonialHandler.Delete)

	// Learning Paths management
	admin.Post("/learning-paths", pathHandler.Create)
	admin.Put("/learning-paths/:id", pathHandler.Update)
	admin.Delete("/learning-paths/:id", pathHandler.Delete)
	admin.Post("/learning-paths/:id/courses", pathHandler.AddCourse)
	admin.Delete("/learning-paths/:id/courses/:courseId", pathHandler.RemoveCourse)

	// 4. Teacher Protected Endpoints
	teacher := api.Group("/teacher", middleware.AuthRequired(cfg), middleware.RolesAllowed("teacher"))
	teacher.Get("/dashboard/analytics", dashboardHandler.GetTeacherAnalytics)

	// Teacher Coupons
	teacher.Get("/coupons", couponHandler.ListTeacherCoupons)
	teacher.Post("/coupons", couponHandler.CreateTeacherCoupon)
	teacher.Put("/coupons/:id", couponHandler.UpdateTeacherCoupon)
	teacher.Put("/coupons/:id/status", couponHandler.ToggleTeacherCouponStatus)

	// Teacher Transactions & Withdrawals
	teacher.Get("/transactions", paymentHandler.ListTeacherTransactions)
	teacher.Get("/withdrawals/balance", paymentHandler.GetTeacherBalance)
	teacher.Get("/withdrawals", paymentHandler.GetTeacherWithdrawals)
	teacher.Post("/withdrawals", paymentHandler.RequestWithdrawal)

	// Teacher Course outlines
	teacher.Get("/courses", courseHandler.GetTeacherCourses)
	teacher.Get("/courses/:id/details", courseHandler.GetTeacherCourseDetails)
	teacher.Post("/courses", courseHandler.CreateCourse)
	teacher.Put("/courses/:id", courseHandler.UpdateCourse)
	teacher.Delete("/courses/:id", courseHandler.DeleteCourse)
	teacher.Put("/courses/:id/status", courseHandler.PublishCourse) // Teacher submits course for review (draft -> pending)

	// Teacher Section builders
	teacher.Post("/courses/:courseId/sections", courseHandler.AddSection)
	teacher.Put("/sections/:sectionId", courseHandler.UpdateSection)
	teacher.Delete("/sections/:sectionId", courseHandler.DeleteSection)

	// Teacher Lesson builders
	teacher.Post("/sections/:sectionId/lessons", courseHandler.AddLesson)
	teacher.Put("/lessons/:lessonId", courseHandler.UpdateLesson)
	teacher.Delete("/lessons/:lessonId", courseHandler.DeleteLesson)

	// Teacher Attachment builder
	teacher.Post("/lessons/:lessonId/attachments", attachmentHandler.CreateAttachment)
	teacher.Delete("/attachments/:id", attachmentHandler.DeleteAttachment)

	// Upload routes
	teacher.Post("/lessons/upload-video", middleware.UploadSecurity(100*1024*1024, []string{"video/mp4", "video/webm"}, "video"), courseHandler.UploadVideo) // Legacy backend upload
	teacher.Post("/courses/upload-image", middleware.UploadSecurity(5*1024*1024, []string{"image/jpeg", "image/png", "image/webp"}, "image"), courseHandler.UploadImage)
	teacher.Get("/upload-signature", courseHandler.GenerateUploadSignature) // Direct cloud upload

	// Teacher Quiz builders
	teacher.Post("/sections/:sectionId/quizzes", quizHandler.CreateQuiz)
	teacher.Post("/quizzes/:quizId/questions", quizHandler.AddQuestions)

	// Teacher Assignment builders & grading
	teacher.Post("/sections/:sectionId/assignments", assignmentHandler.CreateAssignment)
	teacher.Get("/assignments/:assignmentId/submissions", assignmentHandler.ListSubmissions)
	teacher.Put("/submissions/:submissionId/grade", assignmentHandler.GradeSubmission)
	teacher.Get("/courses/:courseId/progress", enrollmentHandler.GetCourseProgress)
	teacher.Post("/reviews/:id/reply", reviewHandler.ReplyToReview)

	// 5. Student Protected Endpoints
	student := api.Group("/student", middleware.AuthRequired(cfg), middleware.RolesAllowed("student"))
	student.Post("/enrollments/enroll/:courseId", enrollmentHandler.EnrollCourse)
	student.Get("/enrollments/my-courses", enrollmentHandler.GetMyCourses)
	student.Post("/progress/lessons/:lessonId/complete", enrollmentHandler.CompleteLesson)
	student.Get("/dashboard/analytics", dashboardHandler.GetStudentAnalytics)

	// Student Gamification
	student.Get("/gamification/profile", gamificationHandler.GetMyProfile)
	student.Post("/gamification/activity", gamificationHandler.TrackActivity)

	// Student Quizzes
	student.Get("/quizzes/:quizId", quizHandler.GetQuiz)
	student.Post("/quizzes/:quizId/submit", quizHandler.SubmitAttempt)

	// Student Assignments
	student.Post("/assignments/:assignmentId/submit", middleware.UploadSecurity(10*1024*1024, []string{"application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}, "file"), assignmentHandler.SubmitAssignment)
	student.Get("/assignments/:assignmentId/my-submission", assignmentHandler.GetMySubmission)

	// Student Payments
	student.Post("/payments/checkout", paymentHandler.Checkout)
	student.Post("/payments/mock-success", paymentHandler.MockSuccess)
	student.Get("/payments/history", paymentHandler.GetPaymentHistory)
	student.Get("/payments/orders/:id/invoice", paymentHandler.DownloadInvoice)
	student.Post("/reviews/:courseId", reviewHandler.SubmitReview)
	student.Put("/reviews/:courseId", reviewHandler.EditReview)

	// Student Cart
	student.Get("/cart", cartHandler.GetCart)
	student.Post("/cart", cartHandler.AddToCart)
	student.Delete("/cart/:id", cartHandler.RemoveFromCart)
	student.Post("/cart/coupon", cartHandler.ApplyCoupon)
	student.Post("/cart/checkout", cartHandler.Checkout)

	// Student Certificates
	student.Post("/enrollments/:courseId/certificate", certificateHandler.GenerateCertificate)
	student.Get("/certificates", certificateHandler.GetMyCertificates)

	student.Get("/dashboard", func(c *fiber.Ctx) error {
		userID := c.Locals("user_id")
		role := c.Locals("user_role")
		return c.JSON(fiber.Map{
			"success": true,
			"message": "Welcome Student!",
			"user_id": userID,
			"role":    role,
		})
	})
}
