package utils

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
	"net/url"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type StorageClient interface {
	UploadFile(ctx context.Context, file io.Reader, filename string, folder string) (string, error)
	GeneratePresignedSignature(ctx context.Context, folder string) (map[string]interface{}, error)
}

type cloudinaryStorage struct {
	cld                *cloudinary.Cloudinary
	isPlaceholderCreds bool
	cloudName          string
	apiKey             string
	apiSecret          string
}

func NewStorageClient(cfg *config.Config) (StorageClient, error) {
	isPlaceholder := cfg.CloudinaryCloudName == "" || 
		cfg.CloudinaryCloudName == "your_cloud_name" || 
		cfg.CloudinaryAPIKey == "your_api_key" || 
		cfg.CloudinaryAPISecret == "your_api_secret"

	if cfg.CloudinaryCloudName == "" || cfg.CloudinaryAPIKey == "" || cfg.CloudinaryAPISecret == "" {
		return nil, errors.New("missing Cloudinary configuration credentials")
	}

	cld, err := cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	if err != nil {
		return nil, err
	}

	return &cloudinaryStorage{
		cld:                cld,
		isPlaceholderCreds: isPlaceholder,
		cloudName:          cfg.CloudinaryCloudName,
		apiKey:             cfg.CloudinaryAPIKey,
		apiSecret:          cfg.CloudinaryAPISecret,
	}, nil
}

func (s *cloudinaryStorage) UploadFile(ctx context.Context, file io.Reader, filename string, folder string) (string, error) {
	// If credentials are placeholders or file is PDF, fallback to local storage
	// Cloudinary often blocks PDF delivery (401 Unauthorized) based on account security settings.
	isPDF := len(filename) > 4 && filename[len(filename)-4:] == ".pdf"
	if s.isPlaceholderCreds || isPDF {
		return s.uploadLocal(file, filename, folder)
	}

	// Try Cloudinary
	uniqueFilename := true
	resourceType := "auto"
	if len(filename) > 4 && filename[len(filename)-4:] == ".pdf" {
		resourceType = "raw"
	}

	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         folder,
		PublicID:       filename,
		UniqueFilename: &uniqueFilename,
		ResourceType:   resourceType,
	})
	if err != nil {
		// Fallback to local storage on error
		return s.uploadLocal(file, filename, folder)
	}
	return resp.SecureURL, nil
}

func (s *cloudinaryStorage) GeneratePresignedSignature(ctx context.Context, folder string) (map[string]interface{}, error) {
	if s.isPlaceholderCreds {
		return nil, errors.New("cannot generate presigned signature with placeholder credentials")
	}

	timestamp := time.Now().Unix()
	paramsToSign := url.Values{
		"folder":    {folder},
		"timestamp": {fmt.Sprintf("%d", timestamp)},
	}

	signature, err := api.SignParameters(paramsToSign, s.apiSecret)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"signature": signature,
		"timestamp": timestamp,
		"cloud_name": s.cloudName,
		"api_key":   s.apiKey,
		"folder":    folder,
	}, nil
}

func (s *cloudinaryStorage) uploadLocal(file io.Reader, filename string, folder string) (string, error) {
	if folder == "" {
		folder = "misc"
	}
	// Create upload folder dynamically
	uploadDir := filepath.Join(".", "uploads", folder)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create local upload directory: %w", err)
	}

	// Generate safe and unique local name
	uniqueName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filename)
	destPath := filepath.Join(uploadDir, uniqueName)

	out, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("failed to create local file: %w", err)
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		return "", fmt.Errorf("failed to write local file data: %w", err)
	}

	// Return local relative URL served by fiber
	// Need backend host base URL, but for relative path:
	return fmt.Sprintf("http://localhost:8080/uploads/%s/%s", folder, uniqueName), nil
}
