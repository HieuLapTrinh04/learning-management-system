package repository

import (
	"context"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"gorm.io/gorm"
)

type TokenRepository interface {
	CreateEmailVerificationToken(ctx context.Context, token *models.EmailVerificationToken) error
	GetEmailVerificationToken(ctx context.Context, tokenStr string) (*models.EmailVerificationToken, error)
	DeleteEmailVerificationToken(ctx context.Context, id uint) error

	CreatePasswordResetToken(ctx context.Context, token *models.PasswordResetToken) error
	GetPasswordResetToken(ctx context.Context, tokenStr string) (*models.PasswordResetToken, error)
	DeletePasswordResetToken(ctx context.Context, id uint) error
}

type tokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) TokenRepository {
	return &tokenRepository{db: db}
}

func (r *tokenRepository) CreateEmailVerificationToken(ctx context.Context, token *models.EmailVerificationToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *tokenRepository) GetEmailVerificationToken(ctx context.Context, tokenStr string) (*models.EmailVerificationToken, error) {
	var token models.EmailVerificationToken
	err := r.db.WithContext(ctx).Where("token = ?", tokenStr).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *tokenRepository) DeleteEmailVerificationToken(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.EmailVerificationToken{}, id).Error
}

func (r *tokenRepository) CreatePasswordResetToken(ctx context.Context, token *models.PasswordResetToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *tokenRepository) GetPasswordResetToken(ctx context.Context, tokenStr string) (*models.PasswordResetToken, error) {
	var token models.PasswordResetToken
	err := r.db.WithContext(ctx).Where("token = ?", tokenStr).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *tokenRepository) DeletePasswordResetToken(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.PasswordResetToken{}, id).Error
}
