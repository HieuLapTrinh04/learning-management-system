package utils

import (
	"fmt"
	"strings"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ValidateStruct checks GORM or request structures tagging constraints and returns AppError on failure.
func ValidateStruct(s interface{}) error {
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	var errorMsgs []string
	for _, err := range err.(validator.ValidationErrors) {
		field := strings.ToLower(err.Field())
		tag := err.Tag()
		param := err.Param()

		var msg string
		switch tag {
		case "required":
			msg = fmt.Sprintf("field '%s' is required", field)
		case "email":
			msg = fmt.Sprintf("field '%s' must be a valid email address", field)
		case "min":
			msg = fmt.Sprintf("field '%s' must be at least %s characters long", field, param)
		case "max":
			msg = fmt.Sprintf("field '%s' must not exceed %s characters", field, param)
		case "oneof":
			msg = fmt.Sprintf("field '%s' must be one of [%s]", field, param)
		default:
			msg = fmt.Sprintf("field '%s' failed validation for rule '%s'", field, tag)
		}
		errorMsgs = append(errorMsgs, msg)
	}

	// Join all validation issues into one descriptive error message
	fullMsg := strings.Join(errorMsgs, "; ")
	return apperrors.NewAppError(apperrors.TypeValidation, fullMsg, err)
}
