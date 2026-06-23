package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type GamificationUseCase interface {
	GetUserGamificationProfile(ctx context.Context, userID uint) (map[string]interface{}, error)
	EvaluateAndAward(ctx context.Context, userID uint, action string, value int) error
	GetLeaderboard(ctx context.Context, limit int) ([]models.User, error)
	TrackDailyActivity(ctx context.Context, userID uint) (uint, uint, error) // Returns (currentStreak, awardedPoints, error)
}

type gamificationUseCase struct {
	gamificationRepo repository.GamificationRepository
	userRepo         repository.UserRepository
	notificationUseCase NotificationUseCase
}

func NewGamificationUseCase(gamificationRepo repository.GamificationRepository, userRepo repository.UserRepository, notificationUseCase NotificationUseCase) GamificationUseCase {
	return &gamificationUseCase{
		gamificationRepo: gamificationRepo,
		userRepo:         userRepo,
		notificationUseCase: notificationUseCase,
	}
}

func (u *gamificationUseCase) GetUserGamificationProfile(ctx context.Context, userID uint) (map[string]interface{}, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "User not found", err)
	}

	badges, err := u.gamificationRepo.GetUserBadges(ctx, userID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to fetch user badges", err)
	}

	return map[string]interface{}{
		"points":         user.Points,
		"current_streak": user.CurrentStreak,
		"highest_streak": user.HighestStreak,
		"badges":         badges,
	}, nil
}

// EvaluateAndAward is called internally by other use cases (e.g. CourseUseCase)
func (u *gamificationUseCase) EvaluateAndAward(ctx context.Context, userID uint, action string, value int) error {
	// Action examples: "complete_lesson" -> value = 10 (points)
	// "complete_course" -> value = courseID (used to check badge conditions)
	
	if action == "complete_lesson" {
		err := u.gamificationRepo.AwardPoints(ctx, userID, uint(value))
		if err == nil && u.notificationUseCase != nil {
			_ = u.notificationUseCase.SendNotification(ctx, userID, "system", fmt.Sprintf("Bạn vừa nhận được %d điểm thưởng vì đã hoàn thành một bài học!", value))
		}
		return err
	}

	if action == "complete_course" {
		// Award big points
		_ = u.gamificationRepo.AwardPoints(ctx, userID, 100)
		
		// Check for badge "course_completion_1"
		badge, err := u.gamificationRepo.GetBadgeByCondition(ctx, "course_completion_1")
		if err == nil && badge != nil {
			hasBadge, _ := u.gamificationRepo.HasBadge(ctx, userID, badge.ID)
			if !hasBadge {
				err = u.gamificationRepo.AwardBadge(ctx, userID, badge.ID)
				if err == nil && u.notificationUseCase != nil {
					_ = u.notificationUseCase.SendNotification(ctx, userID, "system", fmt.Sprintf("Chúc mừng! Bạn đã mở khóa huy hiệu: %s", badge.Name))
				}
			}
		}
	}

	return nil
}

func (u *gamificationUseCase) GetLeaderboard(ctx context.Context, limit int) ([]models.User, error) {
	return u.userRepo.GetLeaderboard(ctx, limit)
}

func (u *gamificationUseCase) TrackDailyActivity(ctx context.Context, userID uint) (uint, uint, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return 0, 0, err
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	
	var awardedPoints uint = 0
	var streakUpdated = false

	if user.LastActiveDate == nil {
		user.CurrentStreak = 1
		user.LastActiveDate = &now
		awardedPoints = 10
		streakUpdated = true
	} else {
		lastActive := *user.LastActiveDate
		lastActiveDay := time.Date(lastActive.Year(), lastActive.Month(), lastActive.Day(), 0, 0, 0, 0, lastActive.Location())

		daysDiff := int(today.Sub(lastActiveDay).Hours() / 24)

		if daysDiff == 1 {
			user.CurrentStreak++
			user.LastActiveDate = &now
			awardedPoints = 10
			streakUpdated = true
			
			// Bonus points for 7-day streak
			if user.CurrentStreak % 7 == 0 {
				awardedPoints += 50
				if u.notificationUseCase != nil {
					_ = u.notificationUseCase.SendNotification(ctx, userID, "system", fmt.Sprintf("Tuyệt vời! Chuỗi học tập %d ngày liên tục. Tặng bạn 50 điểm thưởng!", user.CurrentStreak))
				}
			}
		} else if daysDiff > 1 {
			user.CurrentStreak = 1
			user.LastActiveDate = &now
			awardedPoints = 10
			streakUpdated = true
		} else {
			// daysDiff == 0 (already active today)
			// No points awarded
		}
	}

	if streakUpdated {
		if user.CurrentStreak > user.HighestStreak {
			user.HighestStreak = user.CurrentStreak
		}
		if awardedPoints > 0 {
			user.Points += awardedPoints
		}
		err = u.userRepo.Update(ctx, user)
		if err != nil {
			return 0, 0, err
		}
	}

	return user.CurrentStreak, awardedPoints, nil
}
