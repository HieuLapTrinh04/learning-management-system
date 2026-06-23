package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"gorm.io/gorm"
)

type CourseUseCase interface {
	CreateCourse(ctx context.Context, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error)
	UpdateCourse(ctx context.Context, id, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error)
	DeleteCourse(ctx context.Context, id, teacherID uint) error
	PublishCourse(ctx context.Context, id, callerID uint, role, status string) error

	// Section Methods
	AddSection(ctx context.Context, teacherID, courseID uint, title string, order int) (*models.Section, error)
	UpdateSection(ctx context.Context, teacherID, sectionID uint, title string, order int) (*models.Section, error)
	DeleteSection(ctx context.Context, teacherID, sectionID uint) error

	// Lesson Methods
	AddLesson(ctx context.Context, teacherID, sectionID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error)
	UpdateLesson(ctx context.Context, teacherID, lessonID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error)
	DeleteLesson(ctx context.Context, teacherID, lessonID uint) error

	// Public Browsing Methods
	GetCourseDetails(ctx context.Context, idOrSlug string) (*models.Course, error)
	SearchCourses(ctx context.Context, categorySlug, searchKeyword, priceType string, page, limit int) ([]models.Course, int64, error)
	GetTeacherCourses(ctx context.Context, teacherID uint) ([]models.Course, error)
	GetTeacherCourseDetails(ctx context.Context, teacherID, courseID uint) (*models.Course, error)
	GetAdminCourses(ctx context.Context, status string) ([]models.Course, error)
}

type courseUseCase struct {
	courseRepo  repository.CourseRepository
	sectionRepo repository.SectionRepository
	lessonRepo  repository.LessonRepository
	auditSvc    AuditLogUseCase
}

func NewCourseUseCase(
	courseRepo repository.CourseRepository,
	sectionRepo repository.SectionRepository,
	lessonRepo repository.LessonRepository,
	auditSvc AuditLogUseCase,
) CourseUseCase {
	return &courseUseCase{
		courseRepo:  courseRepo,
		sectionRepo: sectionRepo,
		lessonRepo:  lessonRepo,
		auditSvc:    auditSvc,
	}
}

// Course implementation
func (u *courseUseCase) CreateCourse(ctx context.Context, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error) {
	slug := utils.GenerateSlug(title)

	// Double check slug uniqueness
	existing, err := u.courseRepo.GetBySlug(ctx, slug)
	if err == nil && existing != nil {
		// Append timestamp to ensure slug uniqueness if collision happens
		slug = fmt.Sprintf("%s-%d", slug, time.Now().Unix())
	}

	course := &models.Course{
		Title:        title,
		Slug:         slug,
		Subtitle:     subtitle,
		Description:  description,
		Price:        price,
		ThumbnailURL: thumbnailURL,
		TeacherID:    teacherID,
		CategoryID:   categoryID,
		Status:       "draft",
	}

	err = u.courseRepo.Create(ctx, course)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create course", err)
	}

	// Async audit log
	go u.auditSvc.LogEvent(ctx, &teacherID, "COURSE_CREATED", "Course", &course.ID, fmt.Sprintf("Teacher created course '%s'", title), "")

	return course, nil
}

func (u *courseUseCase) UpdateCourse(ctx context.Context, id, teacherID uint, title, subtitle, description string, price float64, categoryID uint, thumbnailURL string) (*models.Course, error) {
	course, err := u.courseRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	// Validate Ownership
	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	// Re-generate slug if title changed
	if title != course.Title {
		course.Slug = utils.GenerateSlug(title)
		course.Title = title
	}

	course.Subtitle = subtitle
	course.Description = description
	course.Price = price
	course.CategoryID = categoryID
	course.ThumbnailURL = thumbnailURL

	if err := u.courseRepo.Update(ctx, course); err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update course", err)
	}

	go u.auditSvc.LogEvent(ctx, &teacherID, "COURSE_UPDATE", "Course", &course.ID, fmt.Sprintf("Course '%s' updated", course.Title), "")

	return course, nil
}

func (u *courseUseCase) DeleteCourse(ctx context.Context, id, teacherID uint) error {
	course, err := u.courseRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	if course.TeacherID != teacherID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	err = u.courseRepo.Delete(ctx, id)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to delete course in database", err)
	}

	return nil
}

func (u *courseUseCase) PublishCourse(ctx context.Context, id, callerID uint, role, status string) error {
	if status != "draft" && status != "pending" && status != "published" {
		return apperrors.NewAppError(apperrors.TypeValidation, "invalid course status", nil)
	}

	course, err := u.courseRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	if role != "admin" {
		if course.TeacherID != callerID {
			return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
		}
		if status == "published" {
			return apperrors.NewAppError(apperrors.TypeForbidden, "Giáo viên chỉ có thể gửi yêu cầu duyệt (pending). Chỉ quản trị viên mới có quyền xuất bản khóa học.", nil)
		}
	}

	course.Status = status
	err = u.courseRepo.Update(ctx, course)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to update course status", err)
	}

	return nil
}

// Section implementation
func (u *courseUseCase) AddSection(ctx context.Context, teacherID, courseID uint, title string, order int) (*models.Section, error) {
	course, err := u.courseRepo.GetByID(ctx, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	section := &models.Section{
		CourseID: courseID,
		Title:    title,
		Order:    order,
	}

	err = u.sectionRepo.Create(ctx, section)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to add section", err)
	}

	return section, nil
}

func (u *courseUseCase) UpdateSection(ctx context.Context, teacherID, sectionID uint, title string, order int) (*models.Section, error) {
	section, err := u.sectionRepo.GetByID(ctx, sectionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "section not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading parent course", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this section's course", nil)
	}

	section.Title = title
	section.Order = order

	err = u.sectionRepo.Update(ctx, section)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update section", err)
	}

	return section, nil
}

func (u *courseUseCase) DeleteSection(ctx context.Context, teacherID, sectionID uint) error {
	section, err := u.sectionRepo.GetByID(ctx, sectionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "section not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this section's course", nil)
	}

	err = u.sectionRepo.Delete(ctx, sectionID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to delete section", err)
	}

	return nil
}

// Lesson implementation
func (u *courseUseCase) AddLesson(ctx context.Context, teacherID, sectionID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error) {
	section, err := u.sectionRepo.GetByID(ctx, sectionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "section not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	lesson := &models.Lesson{
		SectionID:   sectionID,
		Title:       title,
		Type:        lessonType,
		Content:     content,
		VideoURL:    videoURL,
		DocumentURL: documentURL,
		Duration:    duration,
		Order:       order,
	}

	err = u.lessonRepo.Create(ctx, lesson)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create lesson", err)
	}

	return lesson, nil
}

func (u *courseUseCase) UpdateLesson(ctx context.Context, teacherID, lessonID uint, title, lessonType, content, videoURL, documentURL string, duration, order int) (*models.Lesson, error) {
	lesson, err := u.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "lesson not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, lesson.SectionID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading section", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	lesson.Title = title
	lesson.Type = lessonType
	lesson.Content = content
	lesson.VideoURL = videoURL
	lesson.DocumentURL = documentURL
	lesson.Duration = duration
	lesson.Order = order

	err = u.lessonRepo.Update(ctx, lesson)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to update lesson", err)
	}

	return lesson, nil
}

func (u *courseUseCase) DeleteLesson(ctx context.Context, teacherID, lessonID uint) error {
	lesson, err := u.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperrors.NewAppError(apperrors.TypeNotFound, "lesson not found", err)
		}
		return apperrors.NewAppError(apperrors.TypeInternal, "database search error", err)
	}

	section, err := u.sectionRepo.GetByID(ctx, lesson.SectionID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "database error loading section", err)
	}

	course, err := u.courseRepo.GetByID(ctx, section.CourseID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "database error loading course", err)
	}

	if course.TeacherID != teacherID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}

	err = u.lessonRepo.Delete(ctx, lessonID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to delete lesson", err)
	}

	return nil
}

// Public queries
func (u *courseUseCase) GetCourseDetails(ctx context.Context, idOrSlug string) (*models.Course, error) {
	course, err := u.courseRepo.GetDetails(ctx, idOrSlug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch course outline details", err)
	}
	if course.Status != "published" {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "this course is not available to the public", nil)
	}
	return course, nil
}

func (u *courseUseCase) SearchCourses(ctx context.Context, categorySlug, searchKeyword, priceType string, page, limit int) ([]models.Course, int64, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 10
	}

	courses, total, err := u.courseRepo.Search(ctx, categorySlug, searchKeyword, priceType, page, limit)
	if err != nil {
		return nil, 0, apperrors.NewAppError(apperrors.TypeInternal, "failed to search catalog", err)
	}
	return courses, total, nil
}

func (u *courseUseCase) GetTeacherCourses(ctx context.Context, teacherID uint) ([]models.Course, error) {
	courses, err := u.courseRepo.GetByTeacherID(ctx, teacherID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to get teacher courses", err)
	}
	return courses, nil
}

func (u *courseUseCase) GetTeacherCourseDetails(ctx context.Context, teacherID, courseID uint) (*models.Course, error) {
	course, err := u.courseRepo.GetDetails(ctx, fmt.Sprintf("%d", courseID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "course not found", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch course outline details", err)
	}
	if course.TeacherID != teacherID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "access denied: you do not own this course", nil)
	}
	return course, nil
}

func (u *courseUseCase) GetAdminCourses(ctx context.Context, status string) ([]models.Course, error) {
	courses, err := u.courseRepo.GetAdminCourses(ctx, status)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to get admin courses", err)
	}
	return courses, nil
}
