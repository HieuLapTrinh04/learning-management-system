package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"gorm.io/gorm"
)

type EnrollmentUseCase interface {
	EnrollCourse(ctx context.Context, studentID, courseID uint) (*models.Enrollment, error)
	GetEnrolledCourses(ctx context.Context, studentID uint) ([]models.Enrollment, error)
	CompleteLesson(ctx context.Context, studentID, lessonID uint) (int, error)
	GetCourseProgress(ctx context.Context, teacherID, courseID uint) ([]models.Enrollment, error)
	SetAutoCertifier(fn func(studentID, courseID uint))
}

type enrollmentUseCase struct {
	enrollmentRepo      repository.EnrollmentRepository
	courseRepo          repository.CourseRepository
	lessonRepo          repository.LessonRepository
	sectionRepo         repository.SectionRepository
	notificationUseCase NotificationUseCase
	gamificationUseCase GamificationUseCase
	autoCertifier       func(studentID, courseID uint)
}

func NewEnrollmentUseCase(
	enrollmentRepo repository.EnrollmentRepository,
	courseRepo repository.CourseRepository,
	lessonRepo repository.LessonRepository,
	sectionRepo repository.SectionRepository,
	notificationUseCase NotificationUseCase,
	gamificationUseCase GamificationUseCase,
) EnrollmentUseCase {
	return &enrollmentUseCase{
		enrollmentRepo:      enrollmentRepo,
		courseRepo:          courseRepo,
		lessonRepo:          lessonRepo,
		sectionRepo:         sectionRepo,
		notificationUseCase: notificationUseCase,
		gamificationUseCase: gamificationUseCase,
	}
}

func (u *enrollmentUseCase) SetAutoCertifier(fn func(studentID, courseID uint)) {
	u.autoCertifier = fn
}

func (u *enrollmentUseCase) EnrollCourse(ctx context.Context, studentID, courseID uint) (*models.Enrollment, error) {
	// 1. Verify course status is published
	course, err := u.courseRepo.GetByID(ctx, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error searching course", err)
	}

	if course.Status != "published" {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "cannot enroll: course is not published", nil)
	}

	// 2. Prevent duplicate enrollment
	existing, err := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err == nil && existing != nil {
		return nil, apperrors.NewAppError(apperrors.TypeConflict, "you are already enrolled in this course", nil)
	}

	// 3. Create Enrollment
	enrollment := &models.Enrollment{
		StudentID:          studentID,
		CourseID:           courseID,
		ProgressPercentage: 0,
		EnrolledAt:         time.Now(),
	}

	err = u.enrollmentRepo.Create(ctx, enrollment)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to enroll course", err)
	}

	// 4. Send Course Enrollment notification
	_ = u.notificationUseCase.SendNotification(ctx, studentID, "Đăng ký khóa học thành công", fmt.Sprintf("Bạn đã đăng ký thành công khóa học: %s", course.Title))

	return enrollment, nil
}

func (u *enrollmentUseCase) GetEnrolledCourses(ctx context.Context, studentID uint) ([]models.Enrollment, error) {
	enrollments, err := u.enrollmentRepo.ListByStudent(ctx, studentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to load enrolled courses", err)
	}
	return enrollments, nil
}

func (u *enrollmentUseCase) CompleteLesson(ctx context.Context, studentID, lessonID uint) (int, error) {
	// 1. Fetch lesson
	lesson, err := u.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, apperrors.NewAppError(apperrors.TypeNotFound, "lesson not found", err)
		}
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	// 2. Fetch section to identify course
	section, err := u.sectionRepo.GetByID(ctx, lesson.SectionID)
	if err != nil {
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to identify lesson section", err)
	}

	// 3. Verify student enrollment
	enrollment, err := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, section.CourseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you are not enrolled in this course", err)
		}
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to check enrollment status", err)
	}

	// 4. Record/Update lesson progress completion
	progress, err := u.enrollmentRepo.GetLessonProgress(ctx, enrollment.ID, lessonID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new record
			progress = &models.LessonProgress{
				EnrollmentID: enrollment.ID,
				LessonID:     lessonID,
				IsCompleted:  true,
				CompletedAt:  time.Now(),
			}
			err = u.enrollmentRepo.CreateLessonProgress(ctx, progress)
			if err != nil {
				return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to save lesson progress", err)
			}
			
			// Award points for completing a lesson (First time)
			if u.gamificationUseCase != nil {
				_ = u.gamificationUseCase.EvaluateAndAward(ctx, studentID, "complete_lesson", 10)
			}
		} else {
			return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to check lesson completion history", err)
		}
	} else if !progress.IsCompleted {
		// Update existing record to complete
		progress.IsCompleted = true
		progress.CompletedAt = time.Now()
		err = u.enrollmentRepo.UpdateLessonProgress(ctx, progress)
		if err != nil {
			return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to update lesson progress", err)
		}
		
		// Award points for completing a lesson
		if u.gamificationUseCase != nil {
			_ = u.gamificationUseCase.EvaluateAndAward(ctx, studentID, "complete_lesson", 10)
		}
	}

	// 5. Automatic recalculation of overall course progress
	totalLessons, err := u.enrollmentRepo.CountLessonsInCourse(ctx, section.CourseID)
	if err != nil {
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to count course syllabus lessons", err)
	}

	completedLessons, err := u.enrollmentRepo.CountCompletedLessons(ctx, enrollment.ID)
	if err != nil {
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to query completed lessons count", err)
	}

	progressPercentage := 0
	if totalLessons > 0 {
		progressPercentage = int((completedLessons * 100) / totalLessons)
	}

	// Clamp to 100 maximum
	if progressPercentage > 100 {
		progressPercentage = 100
	}

	// 6. Update enrollment details
	enrollment.ProgressPercentage = progressPercentage
	if progressPercentage == 100 && enrollment.CompletedAt == nil {
		now := time.Now()
		enrollment.CompletedAt = &now
		
		// Award badge for completing a course
		if u.gamificationUseCase != nil {
			_ = u.gamificationUseCase.EvaluateAndAward(ctx, studentID, "complete_course", int(section.CourseID))
		}

		// Trigger auto-cert generation if configured
		if u.autoCertifier != nil {
			u.autoCertifier(studentID, section.CourseID)
		}
	}

	err = u.enrollmentRepo.Update(ctx, enrollment)
	if err != nil {
		return 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to update enrollment course progress percentage", err)
	}

	return progressPercentage, nil
}

func (u *enrollmentUseCase) GetCourseProgress(ctx context.Context, teacherID, courseID uint) ([]models.Enrollment, error) {
	// 1. Verify course ownership
	course, err := u.courseRepo.GetByID(ctx, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	// 2. Fetch enrollments
	enrollments, err := u.enrollmentRepo.GetEnrollmentsByCourse(ctx, courseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch course progress details", err)
	}
	return enrollments, nil
}
