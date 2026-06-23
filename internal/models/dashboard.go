package models

// MonthlyRevenue stores aggregate revenue per month.
type MonthlyRevenue struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

// StudentGrowth stores registration volume counts per month.
type StudentGrowth struct {
	Month string `json:"month"`
	Count int64  `json:"count"`
}

// CourseGrowth stores course creation counts per month.
type CourseGrowth struct {
	Month string `json:"month"`
	Count int64  `json:"count"`
}

// TopCourse stores overview ranking statistics.
type TopCourse struct {
	CourseTitle string  `json:"course_title"`
	Revenue     float64 `json:"revenue"`
	Enrollments int64   `json:"enrollments"`
}

// AdminStats represents high-level metrics for administrative overview.
type AdminStats struct {
	TotalRevenue      float64          `json:"total_revenue"`
	PlatformRevenue   float64          `json:"platform_revenue"`
	TeacherPayout     float64          `json:"teacher_payout"`
	TotalStudents     int64            `json:"total_students"`
	TotalTeachers     int64            `json:"total_teachers"`
	TotalCourses      int64            `json:"total_courses"`
	TotalCertificates int64            `json:"total_certificates"`
	ConversionRate    float64          `json:"conversion_rate"`
	MonthlyRevenue    []MonthlyRevenue `json:"monthly_revenue"`
	StudentGrowth     []StudentGrowth  `json:"student_growth"`
	CourseGrowth      []CourseGrowth   `json:"course_growth"`
	TopCourses        []TopCourse      `json:"top_courses"`
}

// CourseRevenue stores sales revenue breakdown per course.
type CourseRevenue struct {
	CourseID    uint    `json:"course_id"`
	CourseTitle string  `json:"course_title"`
	Revenue     float64 `json:"revenue"`
}

// AssignmentStats aggregates homework details.
type AssignmentStats struct {
	TotalAssignments  int64 `json:"total_assignments"`
	TotalSubmissions  int64 `json:"total_submissions"`
	GradedSubmissions int64 `json:"graded_submissions"`
}

// TeacherStats aggregates stats for courses owned by a specific teacher.
type TeacherStats struct {
	RevenueByCourse  []CourseRevenue `json:"revenue_by_course"`
	StudentCount     int64           `json:"student_count"`
	CompletionRate   float64         `json:"completion_rate"` // percentage from 0 to 100
	TotalCourses     int64           `json:"total_courses"`
	AverageQuizScore float64         `json:"average_quiz_score"`
	AssignmentStats  AssignmentStats `json:"assignment_stats"`
}

// StudentCourseProgress outlines individual course learning stages.
type StudentCourseProgress struct {
	CourseID           uint    `json:"course_id"`
	CourseTitle        string  `json:"course_title"`
	ProgressPercentage int     `json:"progress_percentage"`
	IsCompleted        bool    `json:"is_completed"`
}

// StudentQuizResult aggregates attempts highest score.
type StudentQuizResult struct {
	QuizTitle   string `json:"quiz_title"`
	CourseTitle string `json:"course_title"`
	Score       int    `json:"score"`
	IsPassed    bool   `json:"is_passed"`
}

// StudentAssignmentResult aggregates assignment feedback items.
type StudentAssignmentResult struct {
	AssignmentTitle string `json:"assignment_title"`
	CourseTitle     string `json:"course_title"`
	Score           *int   `json:"score"`
	MaxScore        int    `json:"max_score"`
	Feedback        string `json:"feedback"`
	IsGraded        bool   `json:"is_graded"`
}

// StudentStats collects all metrics for student workspace overview.
type StudentStats struct {
	EnrolledCoursesCount  int                       `json:"enrolled_courses_count"`
	CompletedCoursesCount int                       `json:"completed_courses_count"`
	CertificatesCount     int                       `json:"certificates_count"`
	CourseProgresses      []StudentCourseProgress   `json:"course_progresses"`
	QuizResults           []StudentQuizResult       `json:"quiz_results"`
	AssignmentResults     []StudentAssignmentResult `json:"assignment_results"`
}
