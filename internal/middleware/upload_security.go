package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"
)

// UploadSecurity creates a middleware that restricts uploaded file size and MIME types using Magic Bytes.
func UploadSecurity(maxSize int64, allowedMimes []string, formFileKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Check if the payload is a multipart form
		if !strings.HasPrefix(c.Get("Content-Type"), "multipart/form-data") {
			return c.Next() // Not a file upload request, skip
		}

		// 2. Prevent parsing massive requests into memory by setting BodyLimit on Fiber instance,
		// but since Fiber handles limits globally, we'll enforce limit after parsing headers.
		fileHeader, err := c.FormFile(formFileKey)
		if err != nil {
			// If file is not present, we can just skip or let the handler deal with it.
			// Let handler handle "file required" errors.
			return c.Next()
		}

		// 3. Check File Size
		if fileHeader.Size > maxSize {
			logger.Log.Sugar().Warnf("Upload rejected: file size %d exceeds limit %d", fileHeader.Size, maxSize)
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{
				"error":   "File too large",
				"message": fmt.Sprintf("Maximum allowed size is %d MB", maxSize/(1024*1024)),
			})
		}

		// 4. Sniff MIME type using Magic Bytes
		file, err := fileHeader.Open()
		if err != nil {
			logger.Log.Sugar().Errorf("Failed to open uploaded file for sniffing: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process file"})
		}
		defer file.Close()

		// Read the first 512 bytes (or less if file is smaller)
		buffer := make([]byte, 512)
		n, err := file.Read(buffer)
		if err != nil && err.Error() != "EOF" {
			logger.Log.Sugar().Errorf("Failed to read uploaded file for sniffing: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to process file"})
		}

		// Use net/http to detect content type
		detectedMime := http.DetectContentType(buffer[:n])
		
		// Remove encoding params if any (e.g. "text/plain; charset=utf-8" -> "text/plain")
		detectedMime = strings.Split(detectedMime, ";")[0]

		isAllowed := false
		for _, mime := range allowedMimes {
			if detectedMime == mime {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			logger.Log.Sugar().Warnf("Upload rejected: dangerous or unsupported MIME type detected: %s", detectedMime)
			return c.Status(fiber.StatusUnsupportedMediaType).JSON(fiber.Map{
				"error":   "Unsupported media type",
				"message": fmt.Sprintf("Detected type %s is not allowed. Allowed types: %v", detectedMime, allowedMimes),
			})
		}

		// Passed all security checks
		return c.Next()
	}
}
