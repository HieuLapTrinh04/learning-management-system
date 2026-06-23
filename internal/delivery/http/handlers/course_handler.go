package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type CourseHandler struct {
	useCase       usecase.CourseUseCase
	storageClient utils.StorageClient
}

type CreateCourseRequest struct {
	Title        string  `json:"title" validate:"required,min=5,max=150"`
	Subtitle     string  `json:"subtitle" validate:"max=255"`
	Description  string  `json:"description"`
	Price        float64 `json:"price" validate:"numeric,min=0"`
	CategoryID   uint    `json:"category_id" validate:"required,numeric"`
	ThumbnailURL string  `json:"thumbnail_url" validate:"max=255"`
}

type UpdateCourseRequest struct {
	Title        string  `json:"title" validate:"required,min=5,max=150"`
	Subtitle     string  `json:"subtitle" validate:"max=255"`
	Description  string  `json:"description"`
	Price        float64 `json:"price" validate:"numeric,min=0"`
	CategoryID   uint    `json:"category_id" validate:"required,numeric"`
	ThumbnailURL string  `json:"thumbnail_url" validate:"max=255"`
}

type PublishCourseRequest struct {
	Status string `json:"status" validate:"required,oneof=draft pending published"`
}

type AddSectionRequest struct {
	Title string `json:"title" validate:"required,min=3,max=150"`
	Order int    `json:"order" validate:"numeric,min=0"`
}

type UpdateSectionRequest struct {
	Title string `json:"title" validate:"required,min=3,max=150"`
	Order int    `json:"order" validate:"numeric,min=0"`
}

type AddLessonRequest struct {
	Title       string `json:"title" validate:"required,min=3,max=150"`
	Type        string `json:"type" validate:"required,oneof=video document"`
	Content     string `json:"content"`
	VideoURL    string `json:"video_url" validate:"max=255"`
	DocumentURL string `json:"document_url" validate:"max=255"`
	Duration    int    `json:"duration" validate:"numeric,min=0"`
	Order       int    `json:"order" validate:"numeric,min=0"`
}

type UpdateLessonRequest struct {
	Title       string `json:"title" validate:"required,min=3,max=150"`
	Type        string `json:"type" validate:"required,oneof=video document"`
	Content     string `json:"content"`
	VideoURL    string `json:"video_url" validate:"max=255"`
	DocumentURL string `json:"document_url" validate:"max=255"`
	Duration    int    `json:"duration" validate:"numeric,min=0"`
	Order       int    `json:"order" validate:"numeric,min=0"`
}

func NewCourseHandler(useCase usecase.CourseUseCase, storageClient utils.StorageClient) *CourseHandler {
	return &CourseHandler{
		useCase:       useCase,
		storageClient: storageClient,
	}
}

func (h *CourseHandler) getTeacherID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *CourseHandler) CreateCourse(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	var req CreateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	course, err := h.useCase.CreateCourse(c.Context(), teacherID, req.Title, req.Subtitle, req.Description, req.Price, req.CategoryID, req.ThumbnailURL)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    course,
		"message": "course created successfully",
	})
}

func (h *CourseHandler) UpdateCourse(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("id")
	courseID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	var req UpdateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	course, err := h.useCase.UpdateCourse(c.Context(), uint(courseID), teacherID, req.Title, req.Subtitle, req.Description, req.Price, req.CategoryID, req.ThumbnailURL)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    course,
		"message": "course updated successfully",
	})
}

func (h *CourseHandler) DeleteCourse(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("id")
	courseID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	err = h.useCase.DeleteCourse(c.Context(), uint(courseID), teacherID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "course deleted successfully",
	})
}

func (h *CourseHandler) PublishCourse(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("id")
	courseID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	var req PublishCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	roleVal := c.Locals("user_role")
	role := "teacher"
	if roleVal != nil {
		role = roleVal.(string)
	}

	err = h.useCase.PublishCourse(c.Context(), uint(courseID), teacherID, role, req.Status)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "course publish status updated",
	})
}

func (h *CourseHandler) AddSection(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("courseId")
	courseID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	var req AddSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	section, err := h.useCase.AddSection(c.Context(), teacherID, uint(courseID), req.Title, req.Order)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    section,
		"message": "section added successfully",
	})
}

func (h *CourseHandler) UpdateSection(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("sectionId")
	sectionID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid section ID")
	}

	var req UpdateSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	section, err := h.useCase.UpdateSection(c.Context(), teacherID, uint(sectionID), req.Title, req.Order)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    section,
		"message": "section updated successfully",
	})
}

func (h *CourseHandler) DeleteSection(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("sectionId")
	sectionID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid section ID")
	}

	err = h.useCase.DeleteSection(c.Context(), teacherID, uint(sectionID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "section deleted successfully",
	})
}

func (h *CourseHandler) AddLesson(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("sectionId")
	sectionID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid section ID")
	}

	var req AddLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	lesson, err := h.useCase.AddLesson(c.Context(), teacherID, uint(sectionID), req.Title, req.Type, req.Content, req.VideoURL, req.DocumentURL, req.Duration, req.Order)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    lesson,
		"message": "lesson added successfully",
	})
}

func (h *CourseHandler) UpdateLesson(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid lesson ID")
	}

	var req UpdateLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	lesson, err := h.useCase.UpdateLesson(c.Context(), teacherID, uint(lessonID), req.Title, req.Type, req.Content, req.VideoURL, req.DocumentURL, req.Duration, req.Order)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    lesson,
		"message": "lesson updated successfully",
	})
}

func (h *CourseHandler) DeleteLesson(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid lesson ID")
	}

	err = h.useCase.DeleteLesson(c.Context(), teacherID, uint(lessonID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "lesson deleted successfully",
	})
}

func (h *CourseHandler) GetCourseDetails(c *fiber.Ctx) error {
	idOrSlug := c.Params("idOrSlug")

	course, err := h.useCase.GetCourseDetails(c.Context(), idOrSlug)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    course,
	})
}

func (h *CourseHandler) SearchCourses(c *fiber.Ctx) error {
	category := c.Query("category", "")
	search := c.Query("search", "")
	price := c.Query("price", "")
	
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	courses, total, err := h.useCase.SearchCourses(c.Context(), category, search, price, page, limit)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    courses,
		"meta": fiber.Map{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *CourseHandler) GetTeacherCourses(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	courses, err := h.useCase.GetTeacherCourses(c.Context(), teacherID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    courses,
	})
}

func (h *CourseHandler) GetTeacherCourseDetails(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("id")
	courseID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID")
	}

	course, err := h.useCase.GetTeacherCourseDetails(c.Context(), teacherID, uint(courseID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    course,
	})
}

func (h *CourseHandler) GetAdminCourses(c *fiber.Ctx) error {
	status := c.Query("status", "")
	courses, err := h.useCase.GetAdminCourses(c.Context(), status)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    courses,
	})
}

func (h *CourseHandler) UploadVideo(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("video")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "No video file found in request")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to open video file")
	}
	defer file.Close()

	// 1. Validate File Size (e.g. Max 600MB)
	if fileHeader.Size > 600*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "Video file exceeds the 600MB limit")
	}

	// 2. Validate MIME Type (e.g. only allow video/mp4)
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType != "video/mp4" {
		return fiber.NewError(fiber.StatusUnsupportedMediaType, "Only video/mp4 format is supported")
	}

	if h.storageClient == nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Storage client not configured")
	}

	// Generate a unique filename using timestamp
	uniqueName := fmt.Sprintf("video_%d_%s", time.Now().Unix(), fileHeader.Filename)

	// Upload to Cloudinary under folder "lessons"
	videoURL, err := h.storageClient.UploadFile(c.Context(), file, uniqueName, "lessons")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to upload video: %v", err))
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":   true,
		"video_url": videoURL,
	})
}

func (h *CourseHandler) UploadImage(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "No image file found in request")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to open image file")
	}
	defer file.Close()

	if h.storageClient == nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Storage client not configured")
	}

	uniqueName := fmt.Sprintf("img_%d_%s", time.Now().Unix(), fileHeader.Filename)

	imageURL, err := h.storageClient.UploadFile(c.Context(), file, uniqueName, "courses")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to upload image: %v", err))
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":   true,
		"image_url": imageURL,
	})
}

// GenerateUploadSignature provides a presigned payload to allow the frontend to upload directly to Cloudinary.
func (h *CourseHandler) GenerateUploadSignature(c *fiber.Ctx) error {
	if h.storageClient == nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Storage client not configured")
	}

	folder := c.Query("folder", "lessons")
	
	// Security Whitelist: Only allow specific folders
	allowedFolders := map[string]bool{
		"lessons":     true,
		"assignments": true,
		"avatars":     true,
		"thumbnails":  true,
	}
	if !allowedFolders[folder] {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid or unauthorized upload folder")
	}

	signatureData, err := h.storageClient.GeneratePresignedSignature(c.Context(), folder)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to generate signature: %v", err))
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    signatureData,
	})
}

