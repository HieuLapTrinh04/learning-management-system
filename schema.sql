-- Online Learning Management System (LMS) Database Schema
-- Target Database: MySQL 8.0+
-- Normalization Form: Third Normal Form (3NF)

CREATE DATABASE IF NOT EXISTS `lms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lms_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'student',
    `avatar_url` VARCHAR(255) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`),
    KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1A. Email Verification Tokens
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `email_tokens_token_unique` (`token`),
    CONSTRAINT `fk_email_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1B. Password Reset Tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `pwd_tokens_token_unique` (`token`),
    CONSTRAINT `fk_pwd_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `categories_name_unique` (`name`),
    UNIQUE KEY `categories_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `thumbnail_url` VARCHAR(255) NULL,
    `teacher_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `courses_slug_unique` (`slug`),
    KEY `idx_courses_deleted_at` (`deleted_at`),
    CONSTRAINT `fk_courses_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_courses_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Sections Table
CREATE TABLE IF NOT EXISTS `sections` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_sections_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Lessons Table
CREATE TABLE IF NOT EXISTS `lessons` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `section_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `type` VARCHAR(20) NOT NULL, -- video, document
    `content` TEXT NULL,
    `video_url` VARCHAR(255) NULL,
    `document_url` VARCHAR(255) NULL,
    `duration` INT NOT NULL DEFAULT 0,
    `sort_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_lessons_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Enrollments Table
CREATE TABLE IF NOT EXISTS `enrollments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `progress_percentage` INT NOT NULL DEFAULT 0,
    `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_student_course` (`student_id`, `course_id`),
    CONSTRAINT `fk_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Lesson Progress Table
CREATE TABLE IF NOT EXISTS `lesson_progresses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `enrollment_id` BIGINT UNSIGNED NOT NULL,
    `lesson_id` BIGINT UNSIGNED NOT NULL,
    `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
    `completed_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_enrollment_lesson` (`enrollment_id`, `lesson_id`),
    CONSTRAINT `fk_progresses_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_progresses_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Quizzes Table
CREATE TABLE IF NOT EXISTS `quizzes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `section_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `passing_score` INT NOT NULL DEFAULT 80,
    `max_attempts` INT NOT NULL DEFAULT 3,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_quizzes_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Questions Table
CREATE TABLE IF NOT EXISTS `questions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `quiz_id` BIGINT UNSIGNED NOT NULL,
    `question_text` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'single', -- single, multiple
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Answers Table
CREATE TABLE IF NOT EXISTS `answers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `question_id` BIGINT UNSIGNED NOT NULL,
    `answer_text` VARCHAR(255) NOT NULL,
    `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `quiz_id` BIGINT UNSIGNED NOT NULL,
    `score` INT NOT NULL,
    `is_passed` TINYINT(1) NOT NULL DEFAULT 0,
    `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attempts_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Assignments Table
CREATE TABLE IF NOT EXISTS `assignments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `section_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `file_url` VARCHAR(255) NULL,
    `max_score` INT NOT NULL DEFAULT 10,
    `due_date` TIMESTAMP NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_assignments_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Submissions Table
CREATE TABLE IF NOT EXISTS `submissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `file_url` VARCHAR(255) NOT NULL,
    `score` INT NULL,
    `feedback` TEXT NULL,
    `graded_by` BIGINT UNSIGNED NULL,
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `graded_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_submissions_grader` FOREIGN KEY (`graded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Certificates Table
CREATE TABLE IF NOT EXISTS `certificates` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `enrollment_id` BIGINT UNSIGNED NOT NULL,
    `certificate_code` VARCHAR(50) NOT NULL,
    `file_url` VARCHAR(255) NOT NULL,
    `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `certificates_enrollment_unique` (`enrollment_id`),
    UNIQUE KEY `certificates_code_unique` (`certificate_code`),
    CONSTRAINT `fk_certificates_enrollment` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed
    `txn_ref` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `paid_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `orders_txn_ref_unique` (`txn_ref`),
    CONSTRAINT `fk_orders_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_items_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notifications_user_read` (`user_id`, `is_read`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
