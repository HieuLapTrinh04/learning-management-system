package usecase

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"gorm.io/gorm"
)

type AssignmentUseCase interface {
	CreateAssignment(ctx context.Context, teacherID, sectionID uint, title, description string, maxScore int, dueDate time.Time) (*models.Assignment, error)
	SubmitAssignment(ctx context.Context, studentID, assignmentID uint, file io.Reader, filename string) (*models.Submission, error)
	GetMySubmission(ctx context.Context, studentID, assignmentID uint) (*models.Submission, error)
	ListSubmissions(ctx context.Context, teacherID, assignmentID uint) ([]models.Submission, error)
	GradeSubmission(ctx context.Context, teacherID, submissionID uint, score int, feedback string) (*models.Submission, error)
	RunOverdueGradingCron(intervalMinutes int)
	SetAutoCertifier(fn func(studentID, courseID uint))
}

type assignmentUseCase struct {
	assignmentRepo      repository.AssignmentRepository
	sectionRepo         repository.SectionRepository
	courseRepo          repository.CourseRepository
	enrollmentRepo      repository.EnrollmentRepository
	storageClient       utils.StorageClient
	notificationUseCase NotificationUseCase
	emailSvc            utils.EmailService
	auditSvc            AuditLogUseCase
	autoCertifier       func(studentID, courseID uint)
}

func NewAssignmentUseCase(
	assignmentRepo repository.AssignmentRepository,
	sectionRepo repository.SectionRepository,
	courseRepo repository.CourseRepository,
	enrollmentRepo repository.EnrollmentRepository,
	storageClient utils.StorageClient,
	notificationUseCase NotificationUseCase,
	emailSvc utils.EmailService,
	auditSvc AuditLogUseCase,
) AssignmentUseCase {
	return &assignmentUseCase{
		assignmentRepo:      assignmentRepo,
		sectionRepo:         sectionRepo,
		courseRepo:          courseRepo,
		enrollmentRepo:      enrollmentRepo,
		storageClient:       storageClient,
		notificationUseCase: notificationUseCase,
		emailSvc:            emailSvc,
		auditSvc:            auditSvc,
	}
}

func (u *assignmentUseCase) RunOverdueGradingCron(intervalMinutes int) {
	go func() {
		ticker := time.NewTicker(time.Duration(intervalMinutes) * time.Minute)
		defer ticker.Stop()

		// Run once immediately at startup
		_ = u.assignmentRepo.GradeOverdueAssignmentsToZero(context.Background())

		for range ticker.C {
			_ = u.assignmentRepo.GradeOverdueAssignmentsToZero(context.Background())
		}
	}()
}

func (u *assignmentUseCase) SetAutoCertifier(fn func(studentID, courseID uint)) {
	u.autoCertifier = fn
}

func (u *assignmentUseCase) CreateAssignment(ctx context.Context, teacherID, sectionID uint, title, description string, maxScore int, dueDate time.Time) (*models.Assignment, error) {
	section, err := u.sectionRepo.GetByID(ctx, sectionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "section not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	if dueDate.Before(time.Now()) {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "due date must be in the future", nil)
	}

	assignment := &models.Assignment{
		SectionID:   sectionID,
		Title:       title,
		Description: description,
		MaxScore:    maxScore,
		DueDate:     dueDate,
	}

	err = u.assignmentRepo.CreateAssignment(ctx, assignment)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create assignment", err)
	}

	// Fetch all enrolled students and send email
	enrollments, err := u.enrollmentRepo.GetEnrollmentsByCourse(ctx, course.ID)
	if err == nil {
		dueDateStr := dueDate.Format("02/01/2006 15:04")
		for _, enrollment := range enrollments {
			if enrollment.Student.Email != "" {
				go func(toEmail, toName string) {
					_ = u.emailSvc.SendAssignmentReminderEmail(toEmail, toName, course.Title, title, dueDateStr)
				}(enrollment.Student.Email, enrollment.Student.Name)
			}
		}
	}

	return assignment, nil
}

func (u *assignmentUseCase) SubmitAssignment(ctx context.Context, studentID, assignmentID uint, file io.Reader, filename string) (*models.Submission, error) {
	// 1. Fetch assignment
	assignment, err := u.assignmentRepo.GetByID(ctx, assignmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "assignment not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	// 2. Verify student is enrolled in the parent course
	section, err := u.sectionRepo.GetByID(ctx, assignment.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load assignment section metadata", err)
	}

	_, err = u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, section.CourseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you are not enrolled in this course", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify enrollment", err)
	}

	// 3. Enforce Deadline limits
	if time.Now().After(assignment.DueDate) {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: the assignment submission deadline has passed", nil)
	}

	// 4. Upload file to Cloudinary storage
	folderName := fmt.Sprintf("lms_assignments/course_%d", section.CourseID)
	fileURL, err := u.storageClient.UploadFile(ctx, file, filename, folderName)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to upload assignment file to cloud storage", err)
	}

	// 5. Create or Update submission record
	submission, err := u.assignmentRepo.GetSubmissionByStudent(ctx, studentID, assignmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Brand new submission
			submission = &models.Submission{
				AssignmentID: assignmentID,
				StudentID:    studentID,
				FileURL:      fileURL,
				SubmittedAt:  time.Now(),
			}
			err = u.assignmentRepo.CreateSubmission(ctx, submission)
			if err != nil {
				return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to record assignment submission", err)
			}
		} else {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "database verification error", err)
		}
	} else {
		// Overwrite previous submission file URL and update date
		submission.FileURL = fileURL
		submission.SubmittedAt = time.Now()
		submission.Score = nil // Reset grading on re-submission
		submission.Feedback = ""
		submission.GradedBy = nil
		submission.GradedAt = nil

		err = u.assignmentRepo.UpdateSubmission(ctx, submission)
		if err != nil {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update assignment submission", err)
		}
	}

	// Trigger auto-cert check since they submitted the assignment
	if u.autoCertifier != nil {
		u.autoCertifier(studentID, section.CourseID)
	}

	return submission, nil
}

func (u *assignmentUseCase) GetMySubmission(ctx context.Context, studentID, assignmentID uint) (*models.Submission, error) {
	submission, err := u.assignmentRepo.GetSubmissionByStudent(ctx, studentID, assignmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No submission yet
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}
	return submission, nil
}

func (u *assignmentUseCase) ListSubmissions(ctx context.Context, teacherID, assignmentID uint) ([]models.Submission, error) {
	assignment, err := u.assignmentRepo.GetByID(ctx, assignmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "assignment not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, assignment.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load section details", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify course owner", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	submissions, err := u.assignmentRepo.ListSubmissionsByAssignment(ctx, assignmentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load submissions", err)
	}

	return submissions, nil
}

func (u *assignmentUseCase) GradeSubmission(ctx context.Context, teacherID, submissionID uint, score int, feedback string) (*models.Submission, error) {
	submission, err := u.assignmentRepo.GetSubmissionByID(ctx, submissionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "submission record not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	assignment, err := u.assignmentRepo.GetByID(ctx, submission.AssignmentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load parent assignment metadata", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, assignment.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load section details", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify course owner", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	// Validate score boundaries
	if score < 0 || score > assignment.MaxScore {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, fmt.Sprintf("invalid score: must be between 0 and %d", assignment.MaxScore), nil)
	}

	now := time.Now()
	submission.Score = &score
	submission.Feedback = feedback
	submission.GradedBy = &teacherID
	submission.GradedAt = &now

	err = u.assignmentRepo.UpdateSubmission(ctx, submission)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to save grading details", err)
	}

	// Trigger assignment graded notification
	_ = u.notificationUseCase.SendNotification(ctx, submission.StudentID, "Bài tập đã được chấm điểm", fmt.Sprintf("Bài nộp của bạn cho bài tập '%s' đã được chấm điểm: %d/%d", assignment.Title, score, assignment.MaxScore))

	go u.auditSvc.LogEvent(ctx, &teacherID, "ASSIGNMENT_GRADED", "Submission", &submission.ID, fmt.Sprintf("Graded submission for assignment '%s'. Score: %d/%d", assignment.Title, score, assignment.MaxScore), "")

	// Trigger auto-cert check if graded
	if u.autoCertifier != nil {
		u.autoCertifier(submission.StudentID, section.CourseID)
	}

	return submission, nil
}
