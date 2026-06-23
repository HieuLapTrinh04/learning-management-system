package usecase

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserUseCase interface {
	GetMe(ctx context.Context, userID uint) (*models.User, error)
	UpdateProfile(ctx context.Context, userID uint, name, avatarURL, currentPassword, newPassword string) error
	GetAdminUsers(ctx context.Context, role, status string) ([]models.User, error)
	UpdateUserStatus(ctx context.Context, adminID, targetUserID uint, isActive bool) error
	UpdateUserRole(ctx context.Context, adminID, targetUserID uint, role string) error
	DeleteUser(ctx context.Context, adminID, targetUserID uint) error
}

type userUseCase struct {
	userRepo repository.UserRepository
}

func NewUserUseCase(userRepo repository.UserRepository) UserUseCase {
	return &userUseCase{
		userRepo: userRepo,
	}
}

func (u *userUseCase) GetMe(ctx context.Context, userID uint) (*models.User, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Get user failed", err)
	}
	if user == nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "User not found", nil)
	}

	return user, nil
}

func (u *userUseCase) UpdateProfile(ctx context.Context, userID uint, name, avatarURL, currentPassword, newPassword string) error {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Get user failed", err)
	}
	if user == nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "User not found", nil)
	}

	// If the user wants to change password
	if newPassword != "" {
		if currentPassword == "" {
			return apperrors.NewAppError(apperrors.TypeValidation, "Current password is required to set a new password", nil)
		}

		// Verify current password
		err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword))
		if err != nil {
			return apperrors.NewAppError(apperrors.TypeUnauthorized, "Incorrect current password", err)
		}

		// Hash new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
		if err != nil {
			return apperrors.NewAppError(apperrors.TypeInternal, "Failed to hash password", err)
		}

		user.Password = string(hashedPassword)
	}

	// Update basic info
	if name != "" {
		user.Name = name
	}
	if avatarURL != "" {
		user.AvatarURL = avatarURL
	}

	err = u.userRepo.Update(ctx, user)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Update profile failed", err)
	}

	return nil
}

func (u *userUseCase) GetAdminUsers(ctx context.Context, role, status string) ([]models.User, error) {
	users, err := u.userRepo.GetAllUsers(ctx, role, status)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to get users", err)
	}
	return users, nil
}

func (u *userUseCase) UpdateUserStatus(ctx context.Context, adminID, targetUserID uint, isActive bool) error {
	if adminID == targetUserID {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot block/unblock your own account", nil)
	}

	user, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to get user", err)
	}
	if user == nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "User not found", nil)
	}

	if user.Role == "admin" {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot modify an admin account", nil)
	}

	user.IsActive = isActive
	err = u.userRepo.Update(ctx, user)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to update user status", err)
	}

	return nil
}

func (u *userUseCase) UpdateUserRole(ctx context.Context, adminID, targetUserID uint, role string) error {
	if adminID == targetUserID {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot change your own role", nil)
	}

	if role != "teacher" && role != "student" {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot assign this role", nil)
	}

	user, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to get user", err)
	}
	if user == nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "User not found", nil)
	}

	if user.Role == "admin" {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot modify an admin account", nil)
	}

	user.Role = role
	err = u.userRepo.Update(ctx, user)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to update user role", err)
	}

	return nil
}

func (u *userUseCase) DeleteUser(ctx context.Context, adminID, targetUserID uint) error {
	if adminID == targetUserID {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot delete your own account", nil)
	}

	user, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to get user", err)
	}
	if user == nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "User not found", nil)
	}

	if user.Role == "admin" {
		return apperrors.NewAppError(apperrors.TypeValidation, "You cannot delete an admin account", nil)
	}

	err = u.userRepo.Delete(ctx, targetUserID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to delete user", err)
	}

	return nil
}
