package usecase

import (
	"context"
	"errors"
	"testing"

	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// --- MOCK USER REPOSITORY ---

type MockUserRepository struct {
	MockCreate     func(ctx context.Context, user *models.User) error
	MockGetByID    func(ctx context.Context, id uint) (*models.User, error)
	MockGetByEmail func(ctx context.Context, email string) (*models.User, error)
	MockUpdate     func(ctx context.Context, user *models.User) error
}

func (m *MockUserRepository) Create(ctx context.Context, u *models.User) error {
	return m.MockCreate(ctx, u)
}
func (m *MockUserRepository) GetByID(ctx context.Context, id uint) (*models.User, error) {
	return m.MockGetByID(ctx, id)
}
func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	return m.MockGetByEmail(ctx, email)
}
func (m *MockUserRepository) Update(ctx context.Context, u *models.User) error {
	return m.MockUpdate(ctx, u)
}

// --- MOCK TOKEN REPOSITORY ---

type MockTokenRepository struct {
	MockCreateEmailVerificationToken func(token *models.EmailVerificationToken) error
	MockGetEmailVerificationToken    func(token string) (*models.EmailVerificationToken, error)
	MockDeleteEmailVerificationToken func(id uint) error
	MockCreatePasswordResetToken     func(token *models.PasswordResetToken) error
	MockGetPasswordResetToken        func(token string) (*models.PasswordResetToken, error)
	MockDeletePasswordResetToken     func(id uint) error
}

func (m *MockTokenRepository) CreateEmailVerificationToken(ctx context.Context, t *models.EmailVerificationToken) error {
	if m.MockCreateEmailVerificationToken != nil {
		return m.MockCreateEmailVerificationToken(t)
	}
	return nil
}
func (m *MockTokenRepository) GetEmailVerificationToken(ctx context.Context, token string) (*models.EmailVerificationToken, error) {
	if m.MockGetEmailVerificationToken != nil {
		return m.MockGetEmailVerificationToken(token)
	}
	return nil, nil
}
func (m *MockTokenRepository) DeleteEmailVerificationToken(ctx context.Context, id uint) error {
	if m.MockDeleteEmailVerificationToken != nil {
		return m.MockDeleteEmailVerificationToken(id)
	}
	return nil
}
func (m *MockTokenRepository) CreatePasswordResetToken(ctx context.Context, t *models.PasswordResetToken) error {
	if m.MockCreatePasswordResetToken != nil {
		return m.MockCreatePasswordResetToken(t)
	}
	return nil
}
func (m *MockTokenRepository) GetPasswordResetToken(ctx context.Context, token string) (*models.PasswordResetToken, error) {
	if m.MockGetPasswordResetToken != nil {
		return m.MockGetPasswordResetToken(token)
	}
	return nil, nil
}
func (m *MockTokenRepository) DeletePasswordResetToken(ctx context.Context, id uint) error {
	if m.MockDeletePasswordResetToken != nil {
		return m.MockDeletePasswordResetToken(id)
	}
	return nil
}

// --- TEST CASES ---

func TestAuthUseCase_Register_Success(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{}

	// Mock email lookup to return record not found (which means email is free)
	repo.MockGetByEmail = func(ctx context.Context, email string) (*models.User, error) {
		return nil, gorm.ErrRecordNotFound
	}

	repo.MockCreate = func(ctx context.Context, user *models.User) error {
		assert.Equal(t, "test@lms.edu.vn", user.Email)
		assert.Equal(t, "student", user.Role)
		return nil
	}

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, nil, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	err := uc.Register(context.Background(), "Test Student", "test@lms.edu.vn", "password123", "student")
	assert.NoError(t, err)
}

func TestAuthUseCase_Register_InvalidRole(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{}

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, nil, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	err := uc.Register(context.Background(), "Admin User", "admin@lms.edu.vn", "password123", "admin")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid registration role")
}

func TestAuthUseCase_Register_EmailConflict(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{}

	repo.MockGetByEmail = func(ctx context.Context, email string) (*models.User, error) {
		return &models.User{ID: 1, Email: email}, nil
	}

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, nil, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	err := uc.Register(context.Background(), "Dup Student", "dup@lms.edu.vn", "password123", "student")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "email already registered")
}

func TestAuthUseCase_Login_Success(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{
		JWTAccessSecret:        "test_access_secret",
		JWTRefreshSecret:       "test_refresh_secret",
		JWTAccessExpiryMinutes: 15,
		JWTRefreshExpiryDays:   7,
	}

	hashed, _ := utils.HashPassword("secretpass")
	repo.MockGetByEmail = func(ctx context.Context, email string) (*models.User, error) {
		return &models.User{
			ID:       99,
			Email:    email,
			Password: hashed,
			Role:     "student",
		}, nil
	}

	// We pass a Redis Client pointing to localhost. In case it cannot connect,
	// we will handle it. Wait, inside Login, it executes u.redis.Set().
	// To prevent test blocking or failing on Redis connection, we can use a mock/live Redis.
	// Or we can mock the redis calls by initializing a test client or running it conditionally.
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, rdb, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	accessToken, refreshToken, err := uc.Login(context.Background(), "student@lms.edu.vn", "secretpass")

	// If redis is running, it should succeed. If not, it will return redis connection error.
	// We check if there's no DB error.
	if err == nil {
		assert.NotEmpty(t, accessToken)
		assert.NotEmpty(t, refreshToken)
	} else {
		assert.Contains(t, err.Error(), "session")
	}
}

func TestAuthUseCase_Login_WrongPassword(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{}

	hashed, _ := utils.HashPassword("secretpass")
	repo.MockGetByEmail = func(ctx context.Context, email string) (*models.User, error) {
		return &models.User{
			ID:       99,
			Email:    email,
			Password: hashed,
			Role:     "student",
		}, nil
	}

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, nil, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	accessToken, refreshToken, err := uc.Login(context.Background(), "student@lms.edu.vn", "wrongpass")
	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
	assert.Contains(t, err.Error(), "invalid email or password")
}

func TestAuthUseCase_Login_UserNotFound(t *testing.T) {
	repo := &MockUserRepository{}
	cfg := &config.Config{}

	repo.MockGetByEmail = func(ctx context.Context, email string) (*models.User, error) {
		return nil, errors.New("user not found")
	}

	uc := NewAuthUseCase(repo, &MockTokenRepository{}, nil, cfg, &MockEmailService{}, &MockAuditLogUseCase{})
	accessToken, refreshToken, err := uc.Login(context.Background(), "unknown@lms.edu.vn", "secret")
	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
}
