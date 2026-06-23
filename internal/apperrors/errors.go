package apperrors

import "fmt"

type ErrorType string

const (
	TypeValidation   ErrorType = "VALIDATION_ERROR"
	TypeUnauthorized ErrorType = "UNAUTHORIZED"
	TypeForbidden    ErrorType = "FORBIDDEN"
	TypeNotFound     ErrorType = "NOT_FOUND"
	TypeConflict     ErrorType = "CONFLICT"
	TypeInternal     ErrorType = "INTERNAL_ERROR"
)

type AppError struct {
	Type    ErrorType `json:"type"`
	Message string    `json:"message"`
	Err     error     `json:"-"` // Hidden original error for server logs only
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Type, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Type, e.Message)
}

func NewAppError(errType ErrorType, message string, err error) *AppError {
	return &AppError{
		Type:    errType,
		Message: message,
		Err:     err,
	}
}
