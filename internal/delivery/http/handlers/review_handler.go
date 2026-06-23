package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type ReviewHandler struct {
	useCase usecase.ReviewUseCase
}

func NewReviewHandler(useCase usecase.ReviewUseCase) *ReviewHandler {
	return &ReviewHandler{useCase: useCase}
}

func (h *ReviewHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "yêu cầu phiên làm việc đăng nhập học sinh")
	}
	return userID, nil
}

func (h *ReviewHandler) getTeacherID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "yêu cầu phiên làm việc đăng nhập giảng viên")
	}
	return userID, nil
}

func (h *ReviewHandler) GetCourseReviews(c *fiber.Ctx) error {
	courseIDStr := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã khóa học không hợp lệ")
	}

	// Determine if authenticated user is admin or teacher (optional)
	// We can check if c.Locals user_role is admin or teacher. 
	// In SetupRoutes, this endpoint is public, so locals won't be filled. It will only show unhidden reviews.
	reviews, stats, err := h.useCase.GetReviewsAndStats(c.Context(), uint(courseID), false)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"reviews": reviews,
		"stats":   stats,
	})
}

type WriteReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

func (h *ReviewHandler) SubmitReview(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDStr := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã khóa học không hợp lệ")
	}

	var req WriteReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng nội dung không hợp lệ")
	}

	if req.Comment == "" {
		return fiber.NewError(fiber.StatusBadRequest, "nội dung bình luận không được để trống")
	}

	err = h.useCase.SubmitReview(c.Context(), studentID, uint(courseID), req.Rating, req.Comment)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Gửi đánh giá khóa học thành công",
	})
}

func (h *ReviewHandler) EditReview(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDStr := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã khóa học không hợp lệ")
	}

	var req WriteReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng nội dung không hợp lệ")
	}

	if req.Comment == "" {
		return fiber.NewError(fiber.StatusBadRequest, "nội dung bình luận không được để trống")
	}

	err = h.useCase.EditReview(c.Context(), studentID, uint(courseID), req.Rating, req.Comment)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Cập nhật đánh giá khóa học thành công",
	})
}

type ReplyReviewRequest struct {
	Reply string `json:"reply"`
}

func (h *ReviewHandler) ReplyToReview(c *fiber.Ctx) error {
	teacherID, err := h.getTeacherID(c)
	if err != nil {
		return err
	}

	reviewIDStr := c.Params("id")
	reviewID, err := strconv.ParseUint(reviewIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã đánh giá không hợp lệ")
	}

	var req ReplyReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu phản hồi không hợp lệ")
	}

	if req.Reply == "" {
		return fiber.NewError(fiber.StatusBadRequest, "nội dung trả lời không được để trống")
	}

	err = h.useCase.ReplyToReview(c.Context(), teacherID, uint(reviewID), req.Reply)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Gửi phản hồi đánh giá thành công",
	})
}

type ModerateReviewRequest struct {
	IsHidden bool `json:"is_hidden"`
}

func (h *ReviewHandler) ModerateReview(c *fiber.Ctx) error {
	reviewIDStr := c.Params("id")
	reviewID, err := strconv.ParseUint(reviewIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã đánh giá không hợp lệ")
	}

	var req ModerateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng kiểm duyệt không hợp lệ")
	}

	err = h.useCase.ModerateReview(c.Context(), uint(reviewID), req.IsHidden)
	if err != nil {
		return err
	}

	msg := "hiển thị"
	if req.IsHidden {
		msg = "ẩn"
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Đã " + msg + " đánh giá thành công",
	})
}

func (h *ReviewHandler) AdminListAllReviews(c *fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")
	search := c.Query("search", "")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	reviews, total, err := h.useCase.ListAllReviews(c.Context(), page, limit, search)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"reviews": reviews,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}
