package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type AttachmentHandler struct {
	attachmentUseCase usecase.AttachmentUseCase
}

func NewAttachmentHandler(aUseCase usecase.AttachmentUseCase) *AttachmentHandler {
	return &AttachmentHandler{attachmentUseCase: aUseCase}
}

type CreateAttachmentRequest struct {
	FileName string `json:"file_name"`
	FileURL  string `json:"file_url"`
	FileSize int64  `json:"file_size"`
}

func (h *AttachmentHandler) CreateAttachment(c *fiber.Ctx) error {
	lessonIDStr := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(lessonIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã bài giảng không hợp lệ")
	}

	var req CreateAttachmentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "định dạng yêu cầu không hợp lệ")
	}

	tenantID := c.Locals("tenantID").(uint)

	attachment, err := h.attachmentUseCase.CreateAttachment(c.Context(), tenantID, uint(lessonID), req.FileName, req.FileURL, req.FileSize)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "thêm file đính kèm thành công",
		"data":    attachment,
	})
}

func (h *AttachmentHandler) GetAttachments(c *fiber.Ctx) error {
	lessonIDStr := c.Params("lessonId")
	lessonID, err := strconv.ParseUint(lessonIDStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã bài giảng không hợp lệ")
	}

	attachments, err := h.attachmentUseCase.GetAttachmentsByLesson(c.Context(), uint(lessonID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    attachments,
	})
}

func (h *AttachmentHandler) DeleteAttachment(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mã file đính kèm không hợp lệ")
	}

	err = h.attachmentUseCase.DeleteAttachment(c.Context(), uint(id))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "xóa file đính kèm thành công",
	})
}
