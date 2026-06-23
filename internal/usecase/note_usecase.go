package usecase

import (
	"context"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
)

type NoteUseCase interface {
	Create(ctx context.Context, userID, lessonID uint, content string, timestamp int) (*models.Note, error)
	ListByLesson(ctx context.Context, userID, lessonID uint) ([]models.Note, error)
	Update(ctx context.Context, userID, noteID uint, content string, timestamp int) (*models.Note, error)
	Delete(ctx context.Context, userID, noteID uint) error
}

type noteUseCase struct {
	noteRepo repository.NoteRepository
}

func NewNoteUseCase(noteRepo repository.NoteRepository) NoteUseCase {
	return &noteUseCase{noteRepo: noteRepo}
}

func (u *noteUseCase) Create(ctx context.Context, userID, lessonID uint, content string, timestamp int) (*models.Note, error) {
	if content == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "Content is required", nil)
	}

	note := &models.Note{
		UserID:         userID,
		LessonID:       lessonID,
		Content:        content,
		VideoTimestamp: timestamp,
	}

	err := u.noteRepo.Create(ctx, note)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to create note", err)
	}

	return note, nil
}

func (u *noteUseCase) ListByLesson(ctx context.Context, userID, lessonID uint) ([]models.Note, error) {
	notes, err := u.noteRepo.ListByLessonAndUser(ctx, lessonID, userID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to list notes", err)
	}
	return notes, nil
}

func (u *noteUseCase) Update(ctx context.Context, userID, noteID uint, content string, timestamp int) (*models.Note, error) {
	if content == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "Content is required", nil)
	}

	note, err := u.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeNotFound, "Note not found", err)
	}

	if note.UserID != userID {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, "You are not allowed to update this note", nil)
	}

	note.Content = content
	note.VideoTimestamp = timestamp

	err = u.noteRepo.Update(ctx, note)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Failed to update note", err)
	}

	return note, nil
}

func (u *noteUseCase) Delete(ctx context.Context, userID, noteID uint) error {
	note, err := u.noteRepo.GetByID(ctx, noteID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeNotFound, "Note not found", err)
	}

	if note.UserID != userID {
		return apperrors.NewAppError(apperrors.TypeForbidden, "You are not allowed to delete this note", nil)
	}

	err = u.noteRepo.Delete(ctx, noteID)
	if err != nil {
		return apperrors.NewAppError(apperrors.TypeInternal, "Failed to delete note", err)
	}

	return nil
}
