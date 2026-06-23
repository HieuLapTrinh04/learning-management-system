package handlers

import (
	"strconv"

	"github.com/HieuLapTrinh04/learning-management-system/internal/usecase"
	"github.com/gofiber/fiber/v2"
)

type CertificateHandler struct {
	useCase usecase.CertificateUseCase
}

func NewCertificateHandler(useCase usecase.CertificateUseCase) *CertificateHandler {
	return &CertificateHandler{useCase: useCase}
}

func (h *CertificateHandler) getStudentID(c *fiber.Ctx) (uint, error) {
	val := c.Locals("user_id")
	userID, ok := val.(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "invalid authorization token session")
	}
	return userID, nil
}

func (h *CertificateHandler) GenerateCertificate(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	courseIDParam := c.Params("courseId")
	courseID, err := strconv.ParseUint(courseIDParam, 10, 64)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid course ID parameter")
	}

	cert, err := h.useCase.GenerateCertificate(c.Context(), studentID, uint(courseID))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    cert,
		"message": "certificate generated successfully",
	})
}

func (h *CertificateHandler) VerifyCertificate(c *fiber.Ctx) error {
	code := c.Params("code")
	if code == "" {
		return fiber.NewError(fiber.StatusBadRequest, "certificate code parameter is required")
	}

	cert, err := h.useCase.VerifyCertificate(c.Context(), code)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"certificate_code": cert.CertificateCode,
			"student_name":     cert.Enrollment.Student.Name,
			"course_title":     cert.Enrollment.Course.Title,
			"file_url":         cert.FileURL,
			"issued_at":        cert.IssuedAt,
		},
		"message": "certificate validated successfully",
	})
}

func (h *CertificateHandler) GetMyCertificates(c *fiber.Ctx) error {
	studentID, err := h.getStudentID(c)
	if err != nil {
		return err
	}

	certs, err := h.useCase.GetStudentCertificates(c.Context(), studentID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    certs,
	})
}

