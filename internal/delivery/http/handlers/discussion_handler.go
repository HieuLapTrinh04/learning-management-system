package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type DiscussionHandler struct {
	discussionUseCase usecase.DiscussionUseCase
}

func NewDiscussionHandler(dUseCase usecase.DiscussionUseCase) *DiscussionHandler {
	return &DiscussionHandler{discussionUseCase: dUseCase}
}

type CreateDiscussionRequest struct {
	Content  string `json:"content"`
	ParentID *uint  `json:"parent_id"`
}

func (h *DiscussionHandler) CreateDiscussion(c *fiber.Ctx) error {
	lessonIDStr := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(lessonIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã bài giảng không hợp lệ")
	}

	var req CreateDiscussionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	tenantID := c.Locals("tenantID").(uint)
	userID := c.Locals("user_id").(uint)

	discussion, err := h.discussionUseCase.CreateDiscussion(c.Context(), tenantID, uint(lessonID), userID, req.Content, req.ParentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "thêm thảo luận thành công",
		"data":    discussion,
	})
}

func (h *DiscussionHandler) GetDiscussions(c *fiber.Ctx) error {
	lessonIDStr := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(lessonIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã bài giảng không hợp lệ")
	}

	discussions, err := h.discussionUseCase.GetDiscussionsByLesson(c.Context(), uint(lessonID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    discussions,
	})
}

func (h *DiscussionHandler) DeleteDiscussion(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã thảo luận không hợp lệ")
	}

	userID := c.Locals("user_id").(uint)

	err = h.discussionUseCase.DeleteDiscussion(c.Context(), uint(id), userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "xóa thảo luận thành công",
	})
}
