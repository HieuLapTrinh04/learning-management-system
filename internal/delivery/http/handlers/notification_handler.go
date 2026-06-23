package handlers

import (
	"context"
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/delivery/http/ws"
	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type NotificationHandler struct {
	useCase usecase.NotificationUseCase
	hub     *ws.Hub
}

func NewNotificationHandler(useCase usecase.NotificationUseCase, hub *ws.Hub) *NotificationHandler {
	return &NotificationHandler{
		useCase: useCase,
		hub:     hub,
	}
}

func (h *NotificationHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *NotificationHandler) List(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	notifications, err := h.useCase.GetNotifications(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    notifications,
	})
}

func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	idParam := c.Params("id")
	notificationID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid notification ID parameter")
	}

	err = h.useCase.MarkAsRead(c.Context(), studentID, uint(notificationID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "notification marked as read successfully",
	})
}

func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	err = h.useCase.MarkAllAsRead(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "all notifications marked as read successfully",
	})
}

func (h *NotificationHandler) GenerateWSTicket(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	ticket, err := h.hub.GenerateTicket(c.Context(), studentID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate ws ticket")
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"ticket":  ticket,
	})
}

func (h *NotificationHandler) WebSocketEndpoint() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		ticket := c.Query("ticket")
		if ticket == "" {
			logErr := c.WriteMessage(websocket.TextMessage, []byte(`{"error": "missing ws ticket"}`))
			if logErr != nil {
				return
			}
			return
		}

		userID, err := h.hub.VerifyTicket(context.Background(), ticket)
		if err != nil {
			logErr := c.WriteMessage(websocket.TextMessage, []byte(`{"error": "invalid or expired ws ticket"}`))
			if logErr != nil {
				return
			}
			return
		}

		// Register the WebSocket client in the central Hub
		h.hub.Register(userID, c)

		defer func() {
			h.hub.Unregister(userID, c)
		}()

		// Keep client connection active, listening for client closure events
		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				break
			}
		}
	})
}
