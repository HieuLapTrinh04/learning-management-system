package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetAdminStats(ctx context.Context) (*models.AdminStats, error)
	GetTeacherStats(ctx context.Context, teacherID uint) (*models.TeacherStats, error)
	GetStudentStats(ctx context.Context, studentID uint) (*models.StudentStats, error)
}

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetAdminStats(ctx context.Context, tenantID uint) (*models.AdminStats, error) {
	var stats models.AdminStats

	// 1. Sum of paid orders total amount
	err := r.db.WithContext(ctx).Model(&models.Order{}).
		Where("tenant_id = ? AND status = ?", tenantID, "paid").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&stats.TotalRevenue).Error
	if err != nil {
		return nil, err
	}

	// Calculate Teacher Payout
	err = r.db.WithContext(ctx).Table("order_items oi").
		Joins("JOIN orders o ON oi.order_id = o.id").
		Where("o.tenant_id = ? AND o.status = ?", tenantID, "paid").
		Select("COALESCE(SUM(oi.teacher_revenue), 0)").
		Scan(&stats.TeacherPayout).Error
	if err != nil {
		return nil, err
	}

	stats.PlatformRevenue = stats.TotalRevenue - stats.TeacherPayout

	// 2. Count active students
	err = r.db.WithContext(ctx).Model(&models.User{}).
		Where("tenant_id = ? AND role = ? AND is_active = ?", tenantID, "student", true).
		Count(&stats.TotalStudents).Error
	if err != nil {
		return nil, err
	}

	// 3. Count active teachers
	err = r.db.WithContext(ctx).Model(&models.User{}).
		Where("tenant_id = ? AND role = ? AND is_active = ?", tenantID, "teacher", true).
		Count(&stats.TotalTeachers).Error
	if err != nil {
		return nil, err
	}

	// 4. Count total courses
	err = r.db.WithContext(ctx).Model(&models.Course{}).
		Where("tenant_id = ?", tenantID).
		Count(&stats.TotalCourses).Error
	if err != nil {
		return nil, err
	}

	// 5. Count total certificates issued
	err = r.db.WithContext(ctx).Model(&models.Certificate{}).
		Where("tenant_id = ?", tenantID).
		Count(&stats.TotalCertificates).Error
	if err != nil {
		return nil, err
	}

	// 6. Monthly Revenue (Paid Orders grouped by Month)
	var monthlyRev []models.MonthlyRevenue
	err = r.db.WithContext(ctx).Model(&models.Order{}).
		Where("tenant_id = ? AND status = ?", tenantID, "paid").
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue").
		Group("DATE_FORMAT(created_at, '%Y-%m')").
		Order("month asc").
		Scan(&monthlyRev).Error
	if err != nil {
		return nil, err
	}
	stats.MonthlyRevenue = monthlyRev

	// 7. Student Growth Registration Volume per Month
	var growth []models.StudentGrowth
	err = r.db.WithContext(ctx).Model(&models.User{}).
		Where("tenant_id = ? AND role = ? AND is_active = ?", tenantID, "student", true).
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count").
		Group("DATE_FORMAT(created_at, '%Y-%m')").
		Order("month asc").
		Scan(&growth).Error
	if err != nil {
		return nil, err
	}
	stats.StudentGrowth = growth

	// 8. Top Courses by enrollment count
	var topCourses []models.TopCourse
	err = r.db.WithContext(ctx).Table("courses c").
		Select("c.title as course_title, COALESCE(SUM(oi.price), 0) as revenue, COUNT(oi.id) as enrollments").
		Joins("LEFT JOIN order_items oi ON c.id = oi.course_id").
		Joins("LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'").
		Where("c.tenant_id = ?", tenantID).
		Group("c.id").
		Order("enrollments desc").
		Limit(5).
		Scan(&topCourses).Error
	if err != nil {
		return nil, err
	}
	stats.TopCourses = topCourses

	// 9. Course Growth Volume per Month
	var courseGrowth []models.CourseGrowth
	err = r.db.WithContext(ctx).Model(&models.Course{}).
		Where("tenant_id = ?", tenantID).
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count").
		Group("DATE_FORMAT(created_at, '%Y-%m')").
		Order("month asc").
		Scan(&courseGrowth).Error
	if err != nil {
		return nil, err
	}
	stats.CourseGrowth = courseGrowth

	// 10. Conversion Rate Calculation (Students who made paid orders / Total Students)
	var payingStudentsCount int64
	err = r.db.WithContext(ctx).Table("orders").
		Where("tenant_id = ? AND status = 'paid'", tenantID).
		Select("COUNT(DISTINCT student_id)").
		Scan(&payingStudentsCount).Error
	if err == nil && stats.TotalStudents > 0 {
		stats.ConversionRate = float64(payingStudentsCount) * 100.0 / float64(stats.TotalStudents)
	}

	return &stats, nil
}

func (r *dashboardRepository) GetTeacherStats(ctx context.Context, teacherID uint) (*models.TeacherStats, error) {
	var stats models.TeacherStats

	// 1. Revenue aggregate sorted per course owned by this teacher
	revenueByCourse := []models.CourseRevenue{}
	err := r.db.WithContext(ctx).Table("courses c").
		Select("c.id as course_id, c.title as course_title, COALESCE(SUM(oi.teacher_revenue), 0) as revenue").
		Joins("LEFT JOIN order_items oi ON c.id = oi.course_id").
		Joins("LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'").
		Where("c.teacher_id = ?", teacherID).
		Group("c.id").
		Scan(&revenueByCourse).Error
	if err != nil {
		return nil, err
	}
	stats.RevenueByCourse = revenueByCourse

	// 2. Count distinct student IDs enrolled in this teacher's courses
	err = r.db.WithContext(ctx).Table("enrollments e").
		Joins("JOIN courses c ON e.course_id = c.id").
		Where("c.teacher_id = ?", teacherID).
		Select("COUNT(DISTINCT e.student_id)").
		Scan(&stats.StudentCount).Error
	if err != nil {
		return nil, err
	}

	// 3. Completion rate percentage calculation (progress_percentage = 100)
	var totalEnrollments int64
	err = r.db.WithContext(ctx).Table("enrollments e").
		Joins("JOIN courses c ON e.course_id = c.id").
		Where("c.teacher_id = ?", teacherID).
		Count(&totalEnrollments).Error
	if err != nil {
		return nil, err
	}

	var completedEnrollments int64
	err = r.db.WithContext(ctx).Table("enrollments e").
		Joins("JOIN courses c ON e.course_id = c.id").
		Where("c.teacher_id = ? AND e.progress_percentage = 100", teacherID).
		Count(&completedEnrollments).Error
	if err != nil {
		return nil, err
	}

	stats.CompletionRate = 0.0
	if totalEnrollments > 0 {
		stats.CompletionRate = float64(completedEnrollments) * 100.0 / float64(totalEnrollments)
	}

	// 4. Count total courses owned by this teacher
	err = r.db.WithContext(ctx).Model(&models.Course{}).
		Where("teacher_id = ?", teacherID).
		Count(&stats.TotalCourses).Error
	if err != nil {
		return nil, err
	}

	// 5. Calculate Average Quiz score for quizzes in courses owned by this teacher
	err = r.db.WithContext(ctx).Table("quiz_attempts qa").
		Joins("JOIN quizzes q ON qa.quiz_id = q.id").
		Joins("JOIN sections s ON q.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("c.teacher_id = ?", teacherID).
		Select("COALESCE(AVG(qa.score), 0)").
		Scan(&stats.AverageQuizScore).Error
	if err != nil {
		return nil, err
	}

	// 6. Aggregate assignment statistics
	var totalAssign, totalSub, gradedSub int64
	err = r.db.WithContext(ctx).Table("assignments a").
		Joins("JOIN sections s ON a.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("c.teacher_id = ?", teacherID).
		Count(&totalAssign).Error
	if err != nil {
		return nil, err
	}

	err = r.db.WithContext(ctx).Table("submissions sub").
		Joins("JOIN assignments a ON sub.assignment_id = a.id").
		Joins("JOIN sections s ON a.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("c.teacher_id = ?", teacherID).
		Count(&totalSub).Error
	if err != nil {
		return nil, err
	}

	err = r.db.WithContext(ctx).Table("submissions sub").
		Joins("JOIN assignments a ON sub.assignment_id = a.id").
		Joins("JOIN sections s ON a.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("c.teacher_id = ? AND sub.score IS NOT NULL", teacherID).
		Count(&gradedSub).Error
	if err != nil {
		return nil, err
	}

	stats.AssignmentStats = models.AssignmentStats{
		TotalAssignments:  totalAssign,
		TotalSubmissions:  totalSub,
		GradedSubmissions: gradedSub,
	}

	return &stats, nil
}

func (r *dashboardRepository) GetStudentStats(ctx context.Context, studentID uint) (*models.StudentStats, error) {
	var stats models.StudentStats

	// 1. Enrolled courses count
	var enrollCount int64
	err := r.db.WithContext(ctx).Model(&models.Enrollment{}).
		Where("student_id = ?", studentID).
		Count(&enrollCount).Error
	if err != nil {
		return nil, err
	}
	stats.EnrolledCoursesCount = int(enrollCount)

	// 2. Completed courses count (progress_percentage = 100)
	var completedCount int64
	err = r.db.WithContext(ctx).Model(&models.Enrollment{}).
		Where("student_id = ? AND progress_percentage = 100", studentID).
		Count(&completedCount).Error
	if err != nil {
		return nil, err
	}
	stats.CompletedCoursesCount = int(completedCount)

	// 3. Certificates count
	var certCount int64
	err = r.db.WithContext(ctx).Table("certificates cert").
		Joins("JOIN enrollments e ON cert.enrollment_id = e.id").
		Where("e.student_id = ?", studentID).
		Count(&certCount).Error
	if err != nil {
		return nil, err
	}
	stats.CertificatesCount = int(certCount)

	// 4. Course progress details
	var progressList []models.StudentCourseProgress
	err = r.db.WithContext(ctx).Table("enrollments e").
		Select("e.course_id, c.title as course_title, e.progress_percentage, (e.progress_percentage = 100) as is_completed").
		Joins("JOIN courses c ON e.course_id = c.id").
		Where("e.student_id = ?", studentID).
		Scan(&progressList).Error
	if err != nil {
		return nil, err
	}
	stats.CourseProgresses = progressList

	// 5. Quiz results (highest attempt score per quiz)
	var quizResults []models.StudentQuizResult
	err = r.db.WithContext(ctx).Table("quiz_attempts qa").
		Select("q.title as quiz_title, c.title as course_title, MAX(qa.score) as score, MAX(qa.is_passed) as is_passed").
		Joins("JOIN quizzes q ON qa.quiz_id = q.id").
		Joins("JOIN sections s ON q.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("qa.student_id = ?", studentID).
		Group("qa.quiz_id").
		Scan(&quizResults).Error
	if err != nil {
		return nil, err
	}
	stats.QuizResults = quizResults

	// 6. Assignment results
	var assignResults []models.StudentAssignmentResult
	err = r.db.WithContext(ctx).Table("submissions sub").
		Select("a.title as assignment_title, c.title as course_title, sub.score, a.max_score, sub.feedback, (sub.score IS NOT NULL) as is_graded").
		Joins("JOIN assignments a ON sub.assignment_id = a.id").
		Joins("JOIN sections s ON a.section_id = s.id").
		Joins("JOIN courses c ON s.course_id = c.id").
		Where("sub.student_id = ?", studentID).
		Scan(&assignResults).Error
	if err != nil {
		return nil, err
	}
	stats.AssignmentResults = assignResults

	return &stats, nil
}
