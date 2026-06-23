package handlers

import (
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type NoteHandler struct {
	noteUseCase usecase.NoteUseCase
}

func NewNoteHandler(noteUseCase usecase.NoteUseCase) *NoteHandler {
	return &NoteHandler{noteUseCase: noteUseCase}
}

type CreateNoteRequest struct {
	Content        string `json:"content" validate:"required"`
	VideoTimestamp int    `json:"video_timestamp"`
}

func (h *NoteHandler) Create(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	lessonID, err := c.ParamsInt("lessonId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid lesson ID")
	}

	var req CreateNoteRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	note, err := h.noteUseCase.Create(c.Context(), userID, uint(lessonID), req.Content, req.VideoTimestamp)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    note,
	})
}

func (h *NoteHandler) ListByLesson(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	lessonID, err := c.ParamsInt("lessonId")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid lesson ID")
	}

	notes, err := h.noteUseCase.ListByLesson(c.Context(), userID, uint(lessonID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    notes,
	})
}

type UpdateNoteRequest struct {
	Content        string `json:"content" validate:"required"`
	VideoTimestamp int    `json:"video_timestamp"`
}

func (h *NoteHandler) Update(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	noteID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid note ID")
	}

	var req UpdateNoteRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return err
	}

	note, err := h.noteUseCase.Update(c.Context(), userID, uint(noteID), req.Content, req.VideoTimestamp)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    note,
	})
}

func (h *NoteHandler) Delete(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok || userID == 0 {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	noteID, err := c.ParamsInt("id")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid note ID")
	}

	err = h.noteUseCase.Delete(c.Context(), userID, uint(noteID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "note deleted successfully",
	})
}
