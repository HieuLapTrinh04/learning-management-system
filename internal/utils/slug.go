package utils

import (
	"regexp"
	"strings"
)

var (
	nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9\s-]`)
	multipleDashRegex    = regexp.MustCompile(`-+`)
	whitespaceRegex      = regexp.MustCompile(`\s+`)
)

// GenerateSlug converts any text string into a clean URL-friendly slug.
func GenerateSlug(text string) string {
	slug := strings.ToLower(text)
	
	// Remove non-alphanumeric chars (excluding whitespace and dash)
	slug = nonAlphanumericRegex.ReplaceAllString(slug, "")
	
	// Replace whitespaces with dash
	slug = whitespaceRegex.ReplaceAllString(slug, "-")
	
	// Replace multiple consecutive dashes with a single dash
	slug = multipleDashRegex.ReplaceAllString(slug, "-")
	
	// Trim dashes from start and end
	slug = strings.Trim(slug, "-")
	
	return slug
}
