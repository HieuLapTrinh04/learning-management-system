package middleware

import (
	"log/slog"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/gofiber/fiber/v2"
)

// GlobalErrorHandler catches all routing errors, parses them and returns structured JSON responses.
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	// Default: Internal Server Error
	statusCode := fiber.StatusInternalServerError
	errorType := apperrors.TypeInternal
	message := "An unexpected internal server error occurred"
	var details interface{} = nil

	// Check if it is a Custom AppError
	if appErr, ok := err.(*apperrors.AppError); ok {
		errorType = appErr.Type
		message = appErr.Message

		switch appErr.Type {
		case apperrors.TypeValidation:
			statusCode = fiber.StatusUnprocessableEntity
		case apperrors.TypeUnauthorized:
			statusCode = fiber.StatusUnauthorized
		case apperrors.TypeForbidden:
			statusCode = fiber.StatusForbidden
		case apperrors.TypeNotFound:
			statusCode = fiber.StatusNotFound
		case apperrors.TypeConflict:
			statusCode = fiber.StatusConflict
		}

		// Log original error if present
		if appErr.Err != nil {
			slog.Error("Domain Application Error", "type", appErr.Type, "msg", appErr.Message, "err", appErr.Err)
		}
	} else if fiberErr, ok := err.(*fiber.Error); ok {
		// Handle standard Fiber built-in errors (e.g. 404 router mismatch, bad payload formats)
		statusCode = fiberErr.Code
		message = fiberErr.Message
		if statusCode == fiber.StatusNotFound {
			errorType = apperrors.TypeNotFound
		} else {
			errorType = apperrors.TypeValidation
		}
	} else {
		// Log completely unhandled panics or raw database errors
		slog.Error("Unhandled Server Crash/Error", "err", err)
	}

	response := fiber.Map{
		"success": false,
		"error": fiber.Map{
			"type":    errorType,
			"message": message,
		},
	}

	if details != nil {
		response["error"].(fiber.Map)["details"] = details
	}

	return c.Status(statusCode).JSON(response)
}
