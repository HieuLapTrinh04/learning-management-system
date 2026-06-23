package usecase

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/redis/go-redis/v9"
)

type AuthUseCase interface {
	Register(ctx context.Context, name, email, password, role string) error
	Login(ctx context.Context, email, password string) (string, string, error)
	Logout(ctx context.Context, refreshToken string) error
	RefreshToken(ctx context.Context, oldRefreshToken string) (string, string, error)
	VerifyEmail(ctx context.Context, token string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
}

type authUseCase struct {
	userRepo  repository.UserRepository
	tokenRepo repository.TokenRepository
	redis     *redis.Client
	cfg       *config.Config
	emailSvc  utils.EmailService
	auditSvc  AuditLogUseCase
}

func NewAuthUseCase(userRepo repository.UserRepository, tokenRepo repository.TokenRepository, rdb *redis.Client, cfg *config.Config, emailSvc utils.EmailService, auditSvc AuditLogUseCase) AuthUseCase {
	return &authUseCase{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
		redis:     rdb,
		cfg:       cfg,
		emailSvc:  emailSvc,
		auditSvc:  auditSvc,
	}
}

func (u *authUseCase) Register(ctx context.Context, name, email, password, role string) error {
	if role != "student" && role != "teacher" {
		return apperrors.NewAppError(apperrors.TypeValidation, "invalid registration role", nil)
	}

	// Check if email already registered
	existing, err := u.userRepo.GetByEmail(ctx, email)
	if err == nil && existing != nil {
		return apperrors.NewAppError(apperrors.TypeConflict, "email already registered", nil)
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to secure password hash", err)
	}

	tenantID, ok := ctx.Value("tenantID").(uint)
	if !ok || tenantID == 0 {
		tenantID = 1 // Fallback to default tenant if missing
	}

	user := &models.User{
		TenantID:        tenantID,
		Name:            name,
		Email:           email,
		Password:        hashedPassword,
		Role:            role,
		IsActive:        true,
		IsEmailVerified: false,
	}

	err = u.userRepo.Create(ctx, user)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "database failed to register user", err)
	}

	// Generate verification token and send email
	tokenStr, _ := utils.GenerateRandomToken(32)
	verificationToken := &models.EmailVerificationToken{
		UserID:    user.ID,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	u.tokenRepo.CreateEmailVerificationToken(ctx, verificationToken)

	// frontend URL logic depending on env
	frontendURL := "http://localhost:5173"
	if u.cfg.Env == "production" {
		frontendURL = "https://lms.buihieu.com" // You can change this to a dynamic domain config
	}

	go func() {
		u.emailSvc.SendRegistrationVerificationEmail(user.Email, user.Name, tokenStr, frontendURL)
		u.auditSvc.LogEvent(ctx, &user.ID, "REGISTER", "User", &user.ID, "User registered account", "")
	}()

	return nil
}

func (u *authUseCase) VerifyEmail(ctx context.Context, tokenStr string) error {
	token, err := u.tokenRepo.GetEmailVerificationToken(ctx, tokenStr)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeValidation, "invalid or expired token", err)
	}

	if time.Now().After(token.ExpiresAt) {
		return apperrors.NewAppError(apperrors.TypeValidation, "token has expired", nil)
	}

	user, err := u.userRepo.GetByID(ctx, token.UserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "user not found", err)
	}

	user.IsEmailVerified = true
	if err := u.userRepo.Update(ctx, user); err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to update user", err)
	}

	u.tokenRepo.DeleteEmailVerificationToken(ctx, token.ID)
	return nil
}

func (u *authUseCase) ForgotPassword(ctx context.Context, email string) error {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		// Don't leak if email exists
		return nil
	}

	tokenStr, _ := utils.GenerateRandomToken(32)
	resetToken := &models.PasswordResetToken{
		UserID:    user.ID,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	u.tokenRepo.CreatePasswordResetToken(ctx, resetToken)

	frontendURL := "http://localhost:5173"
	if u.cfg.Env == "production" {
		frontendURL = "https://lms.buihieu.com" // You can change this to a dynamic domain config
	}

	go func() {
		u.emailSvc.SendPasswordResetEmail(user.Email, user.Name, tokenStr, frontendURL)
	}()

	return nil
}

func (u *authUseCase) ResetPassword(ctx context.Context, tokenStr, newPassword string) error {
	token, err := u.tokenRepo.GetPasswordResetToken(ctx, tokenStr)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeValidation, "invalid or expired token", err)
	}

	if time.Now().After(token.ExpiresAt) {
		return apperrors.NewAppError(apperrors.TypeValidation, "token has expired", nil)
	}

	user, err := u.userRepo.GetByID(ctx, token.UserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "user not found", err)
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to secure password hash", err)
	}

	user.Password = hashedPassword
	if err := u.userRepo.Update(ctx, user); err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to update password", err)
	}

	u.tokenRepo.DeletePasswordResetToken(ctx, token.ID)
	return nil
}

func (u *authUseCase) Login(ctx context.Context, email, password string) (string, string, error) {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "invalid email or password", err)
	}

	if !utils.CheckPasswordHash(password, user.Password) {
		return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "invalid email or password", nil)
	}

	// Generate access token
	accessToken, err := utils.GenerateAccessToken(user.ID, user.TenantID, user.Role, u.cfg.JWTAccessSecret, u.cfg.JWTAccessExpiryMinutes)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to generate access token", err)
	}

	// Generate refresh token
	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.TenantID, user.Role, u.cfg.JWTRefreshSecret, u.cfg.JWTRefreshExpiryDays)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to generate refresh token", err)
	}

	// Save session in Redis
	tokenHash := u.hashToken(refreshToken)
	redisKey := fmt.Sprintf("session:%s", tokenHash)
	ttl := time.Duration(u.cfg.JWTRefreshExpiryDays) * 24 * time.Hour

	err = u.redis.Set(ctx, redisKey, user.ID, ttl).Err()
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to store refresh token in session storage", err)
	}

	go u.auditSvc.LogEvent(ctx, &user.ID, "LOGIN", "User", &user.ID, "User logged in successfully", "")

	return accessToken, refreshToken, nil
}

func (u *authUseCase) Logout(ctx context.Context, refreshToken string) error {
	tokenHash := u.hashToken(refreshToken)
	redisKey := fmt.Sprintf("session:%s", tokenHash)

	// Delete from Redis
	err := u.redis.Del(ctx, redisKey).Err()
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "failed to destroy session in cache", err)
	}
	return nil
}

func (u *authUseCase) RefreshToken(ctx context.Context, oldRefreshToken string) (string, string, error) {
	// Parse the old refresh token
	claims, err := utils.ParseToken(oldRefreshToken, u.cfg.JWTRefreshSecret)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "invalid refresh token", err)
	}

	// Verify in Redis
	tokenHash := u.hashToken(oldRefreshToken)
	redisKey := fmt.Sprintf("session:%s", tokenHash)

	userIDVal, err := u.redis.Get(ctx, redisKey).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "session expired or logged out", nil)
		}
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to check cache session", err)
	}

	// Fetch user to ensure they are still active
	user, err := u.userRepo.GetByID(ctx, claims.UserID)
	if err != nil || !user.IsActive {
		return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "user not found or inactive", err)
	}

	// Verify ID matches the Redis record
	if fmt.Sprintf("%d", user.ID) != userIDVal {
		return "", "", apperrors.NewAppError(apperrors.TypeUnauthorized, "session credentials mismatch", nil)
	}

	// Generate new tokens (Refresh Token Rotation)
	newAccessToken, err := utils.GenerateAccessToken(user.ID, user.TenantID, user.Role, u.cfg.JWTAccessSecret, u.cfg.JWTAccessExpiryMinutes)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to generate access token", err)
	}

	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, user.TenantID, user.Role, u.cfg.JWTRefreshSecret, u.cfg.JWTRefreshExpiryDays)
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to generate refresh token", err)
	}

	// Delete old session and save new session in Redis
	u.redis.Del(ctx, redisKey)

	newTokenHash := u.hashToken(newRefreshToken)
	newRedisKey := fmt.Sprintf("session:%s", newTokenHash)
	ttl := time.Duration(u.cfg.JWTRefreshExpiryDays) * 24 * time.Hour

	err = u.redis.Set(ctx, newRedisKey, user.ID, ttl).Err()
	if err != nil {
		return "", "", apperrors.NewAppError(apperrors.TypeInternal, "failed to store session in cache", err)
	}

	return newAccessToken, newRefreshToken, nil
}

func (u *authUseCase) hashToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}
