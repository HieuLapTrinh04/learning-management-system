package usecase

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/HieuLapTrinh04/learning-management-system/internal/apperrors"
	"github.com/HieuLapTrinh04/learning-management-system/internal/config"
	"github.com/HieuLapTrinh04/learning-management-system/internal/models"
	"github.com/HieuLapTrinh04/learning-management-system/internal/repository"
	"github.com/HieuLapTrinh04/learning-management-system/internal/utils"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/skip2/go-qrcode"
	"gorm.io/gorm"
)

type CertificateUseCase interface {
	GenerateCertificate(ctx context.Context, studentID, courseID uint) (*models.Certificate, error)
	TriggerAutoCertificateAsync(studentID, courseID uint)
	VerifyCertificate(ctx context.Context, code string) (*models.Certificate, error)
	GetStudentCertificates(ctx context.Context, studentID uint) ([]models.Certificate, error)
}

type certificateUseCase struct {
	certRepo            repository.CertificateRepository
	enrollmentRepo      repository.EnrollmentRepository
	storageClient       utils.StorageClient
	notificationUseCase NotificationUseCase
	emailSvc            utils.EmailService
	cfg                 *config.Config
}

func NewCertificateUseCase(
	certRepo repository.CertificateRepository,
	enrollmentRepo repository.EnrollmentRepository,
	storageClient utils.StorageClient,
	notificationUseCase NotificationUseCase,
	emailSvc utils.EmailService,
	cfg *config.Config,
) CertificateUseCase {
	return &certificateUseCase{
		certRepo:            certRepo,
		enrollmentRepo:      enrollmentRepo,
		storageClient:       storageClient,
		notificationUseCase: notificationUseCase,
		emailSvc:            emailSvc,
		cfg:                 cfg,
	}
}

func (u *certificateUseCase) GenerateCertificate(ctx context.Context, studentID, courseID uint) (*models.Certificate, error) {
	// 1. Fetch enrollment with related student and course details
	enrollment, err := u.enrollmentRepo.GetByStudentAndCourse(ctx, studentID, courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "enrollment not found for this course", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query enrollment details", err)
	}

	// 2. Load Student details if they aren't preloaded
	// GORM preloads them in GetByID, but not necessarily in GetByStudentAndCourse depending on implementation.
	// Let's reload using GetByID to make sure Enrollment, Student, and Course are fully populated.
	fullEnrollment, err := u.enrollmentRepo.GetByID(ctx, enrollment.ID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to reload enrollment details", err)
	}

	// 3. Condition 1: Check course progress completeness
	if fullEnrollment.ProgressPercentage < 100 {
		return nil, apperrors.NewAppError(apperrors.TypeForbidden, fmt.Sprintf("course progress is not complete (%d%%). Please complete all lessons.", fullEnrollment.ProgressPercentage), nil)
	}

	// 4. Condition 2: Validate student passed all quizzes in the course
	quizzes, err := u.certRepo.GetCourseQuizzes(ctx, courseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query course quizzes list", err)
	}

	for _, quiz := range quizzes {
		passed, err := u.certRepo.HasPassedQuiz(ctx, studentID, quiz.ID)
		if err != nil {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify student quiz attempt results", err)
		}
		if !passed {
			return nil, apperrors.NewAppError(apperrors.TypeForbidden, fmt.Sprintf("Chưa thể cấp chứng chỉ: Bạn chưa vượt qua bài kiểm tra '%s'", quiz.Title), nil)
		}
	}

	// 5. Condition 3: Validate student submitted all required assignments in the course
	assignments, err := u.certRepo.GetCourseAssignments(ctx, courseID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to query course assignments list", err)
	}

	for _, assignment := range assignments {
		submitted, err := u.certRepo.HasSubmittedAssignment(ctx, studentID, assignment.ID)
		if err != nil {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to verify student assignment submission results", err)
		}
		if !submitted {
			return nil, apperrors.NewAppError(apperrors.TypeForbidden, fmt.Sprintf("Chưa thể cấp chứng chỉ: Bạn chưa nộp bài tập '%s'", assignment.Title), nil)
		}
	}

	// 6. Check if certificate already exists to avoid redundant generation
	existing, err := u.certRepo.GetByEnrollmentID(ctx, fullEnrollment.ID)
	if err == nil && existing != nil {
		return existing, nil
	}

	// 6. Certificate code generation (LMS-CERT-<student>-<course>-<nanoHex>)
	nanoHex := fmt.Sprintf("%x", time.Now().UnixNano()%100000000)
	certCode := fmt.Sprintf("LMS-CERT-%d-%d-%s", studentID, courseID, strings.ToUpper(nanoHex))

	// 7. QR Verification Link & Image Code Generation
	verifyURL := fmt.Sprintf("http://localhost:8080/api/v1/certificates/verify/%s", certCode)
	qrBytes, err := qrcode.Encode(verifyURL, qrcode.Medium, 256)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to construct qr verification code", err)
	}
	qrBase64 := base64.StdEncoding.EncodeToString(qrBytes)

	// 8. Premium Cream-and-Gold HTML Template Design (Pure CSS, NO CDN to prevent hangs)
	issueDateFormatted := time.Now().Format("January 02, 2006")
	htmlTemplate := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1056px;
            height: 816px;
            overflow: hidden;
            box-sizing: border-box;
        }
        .container {
            position: relative;
            width: 1056px;
            height: 816px;
            background-color: #FCFBF9;
            color: #1e293b;
            padding: 48px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            border: 12px double #C5A880;
            box-sizing: border-box;
        }
        .corner {
            position: absolute;
            width: 48px;
            height: 48px;
            border-color: #C5A880;
            border-style: solid;
        }
        .top-left { top: 16px; left: 16px; border-width: 4px 0 0 4px; }
        .top-right { top: 16px; right: 16px; border-width: 4px 4px 0 0; }
        .bottom-left { bottom: 16px; left: 16px; border-width: 0 0 4px 4px; }
        .bottom-right { bottom: 16px; right: 16px; border-width: 0 4px 4px 0; }
        
        .header { text-align: center; margin-top: 24px; }
        .header h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.4em; font-weight: 600; color: #A88B58; margin-bottom: 4px; }
        .header .divider { width: 64px; height: 2px; background-color: #C5A880; margin: 0 auto 16px auto; }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 800; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 8px; }
        .header p { font-size: 12px; font-style: italic; color: #94a3b8; margin: 0; }
        
        .student-name { text-align: center; margin: 16px 0; }
        .student-name h3 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 600; color: #A88B58; border-bottom: 2px solid #EADFC9; padding: 8px 32px; display: inline-block; font-style: italic; margin: 0; }
        
        .description { text-align: center; max-width: 672px; padding: 0 24px; }
        .description p.top { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }
        .description h4 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1e293b; margin: 12px 0; letter-spacing: 0.05em; }
        .description p.bottom { font-size: 12px; color: #94a3b8; margin: 0; }
        
        .footer { width: 100%%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 48px; margin-bottom: 24px; box-sizing: border-box; }
        
        .qr-panel { display: flex; align-items: center; gap: 16px; background-color: #FAF8F5; border: 1px solid #EADFC9; padding: 12px; border-radius: 12px; }
        .qr-panel img { width: 80px; height: 80px; border: 1px solid #e2e8f0; }
        .qr-info p.title { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #A88B58; letter-spacing: 0.05em; margin: 0 0 4px 0; }
        .qr-info p.code { font-size: 9px; color: #94a3b8; font-family: monospace; margin: 0; }
        .qr-info p.desc { font-size: 9px; color: #94a3b8; margin: 0; }
        
        .date-panel, .sign-panel { text-align: center; display: flex; flex-direction: column; justify-content: flex-end; height: 80px; }
        .date-panel p.label, .sign-panel p.label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 4px 0 0 0; }
        .date-panel p.val { font-size: 14px; font-weight: 600; color: #334155; margin: 4px 0 0 0; }
        .date-panel .line { width: 96px; height: 1px; background-color: #e2e8f0; margin: 8px auto 0 auto; }
        
        .sign-panel p.sign { font-family: 'Playfair Display', serif; font-style: italic; font-size: 20px; color: #A88B58; font-weight: 700; margin: 0 0 4px 0; }
        .sign-panel .line { width: 128px; height: 1px; background-color: #cbd5e1; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="header">
            <h2>Chứng nhận hoàn thành khóa học</h2>
            <div class="divider"></div>
            <h1>CHỨNG CHỈ TỐT NGHIỆP</h1>
            <p>Chứng nhận này được trao tặng trang trọng cho</p>
        </div>

        <div class="student-name">
            <h3>%s</h3>
        </div>

        <div class="description">
            <p class="top">Đã nỗ lực và hoàn thành xuất sắc toàn bộ chương trình đào tạo của khóa học trực tuyến chất lượng cao:</p>
            <h4>%s</h4>
            <p class="bottom">được cung cấp bởi hệ thống Quản lý học tập trực tuyến Online LMS Platform.</p>
        </div>

        <div class="footer">
            <div class="qr-panel">
                <img src="data:image/png;base64,%s" alt="QR Verify" />
                <div class="qr-info">
                    <p class="title">Xác thực chứng chỉ</p>
                    <p class="code">Mã số: %s</p>
                    <p class="desc">Quét mã QR để kiểm tra tính xác thực</p>
                </div>
            </div>

            <div class="date-panel">
                <p class="label">Ngày cấp</p>
                <p class="val">%s</p>
                <div class="line"></div>
            </div>

            <div class="sign-panel">
                <p class="sign">Hieu Lap Trinh</p>
                <div class="line"></div>
                <p class="label">Giảng viên hướng dẫn</p>
            </div>
        </div>
    </div>
</body>
</html>`, fullEnrollment.Student.Name, fullEnrollment.Course.Title, qrBase64, certCode, issueDateFormatted)

	// 9. Chromedp Headless Browser PDF print pipeline execution
	pdfBuf, err := u.renderHTMLToPDF(htmlTemplate)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "Lỗi hệ thống: Không thể khởi tạo thư viện in PDF (Chromedp)", err)
	}

	// 10. File storage uploading / local fallback saving
	var fileURL string
	if u.storageClient != nil {
		// Attempt uploading directly to Cloudinary
		uniqueName := fmt.Sprintf("%s_%d.pdf", certCode, time.Now().Unix())
		urlCloud, errUpload := u.storageClient.UploadFile(ctx, bytes.NewReader(pdfBuf), uniqueName, "certificates")
		if errUpload == nil && urlCloud != "" {
			fileURL = urlCloud
		}
	}

	// Fallback to local storage if Cloudinary upload failed or was not configured
	if fileURL == "" {
		localDir := filepath.Join(".", "uploads", "certificates")
		if errMk := os.MkdirAll(localDir, 0755); errMk != nil {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to create local storage directory for certificates fallback", errMk)
		}

		localPath := filepath.Join(localDir, fmt.Sprintf("%s.pdf", certCode))
		if errWrite := os.WriteFile(localPath, pdfBuf, 0644); errWrite != nil {
			return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to save fallback local certificate file", errWrite)
		}

		// Save local URL path served statically by Fiber
		fileURL = fmt.Sprintf("http://localhost:8080/uploads/certificates/%s.pdf", certCode)
	}

	// 11. Database record persistence
	certificate := &models.Certificate{
		EnrollmentID:    fullEnrollment.ID,
		CertificateCode: certCode,
		FileURL:         fileURL,
		IssuedAt:        time.Now(),
	}

	err = u.certRepo.Create(ctx, certificate)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to save certificate to database log ledger", err)
	}

	// Trigger certificate issued notification
	_ = u.notificationUseCase.SendNotification(ctx, studentID, "Chứng chỉ đã được cấp", fmt.Sprintf("Chúc mừng! Bạn đã được cấp chứng chỉ tốt nghiệp cho khóa học: %s", fullEnrollment.Course.Title))

	if fullEnrollment.Student.Email != "" {
		go func(toEmail, toName, courseTitle, certURL string) {
			_ = u.emailSvc.SendCertificateIssuedEmail(toEmail, toName, courseTitle, certURL)
		}(fullEnrollment.Student.Email, fullEnrollment.Student.Name, fullEnrollment.Course.Title, fileURL)
	}

	// Fetch fully loaded record to return complete models structure
	return u.certRepo.GetByID(ctx, certificate.ID)
}

func (u *certificateUseCase) TriggerAutoCertificateAsync(studentID, courseID uint) {
	go func() {
		// Create a detached context with timeout for background task
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		// Wait briefly to ensure DB transactions from caller have completed
		time.Sleep(2 * time.Second)

		_, err := u.GenerateCertificate(ctx, studentID, courseID)
		if err != nil {
			// This is expected if conditions (100% progress, quizzes, assignments) are not fully met yet.
			// We just ignore the error silently.
		}
	}()
}

func (u *certificateUseCase) VerifyCertificate(ctx context.Context, code string) (*models.Certificate, error) {
	if code == "" {
		return nil, apperrors.NewAppError(apperrors.TypeValidation, "certificate verification code cannot be empty", nil)
	}

	cert, err := u.certRepo.GetByCode(ctx, code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperrors.NewAppError(apperrors.TypeNotFound, "certificate credential not found or invalid code", err)
		}
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "database error querying certificate code", err)
	}

	return cert, nil
}

func (u *certificateUseCase) renderHTMLToPDF(htmlContent string) ([]byte, error) {
	// 1. Configure exec options for Headless Chrome
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.NoSandbox,
		chromedp.Headless,
		chromedp.DisableGPU,
	)

	allocCtx, allocCancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	// 2. Set timeout limit (30 seconds)
	ctx, cancel = context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	var buf []byte
	// 3. Print HTML page to PDF buffer landscape mode using cdproto API
	err := chromedp.Run(ctx,
		chromedp.Navigate("data:text/html;charset=utf-8,"+url.PathEscape(htmlContent)),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			buf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithLandscape(true).
				WithPaperWidth(11.0).
				WithPaperHeight(8.5).
				WithMarginTop(0).
				WithMarginBottom(0).
				WithMarginLeft(0).
				WithMarginRight(0).
				Do(ctx)
			return err
		}),
	)
	if err != nil {
		return nil, err
	}

	return buf, nil
}

func (u *certificateUseCase) GetStudentCertificates(ctx context.Context, studentID uint) ([]models.Certificate, error) {
	certs, err := u.certRepo.ListCertificatesByStudentID(ctx, studentID)
	if err != nil {
		return nil, apperrors.NewAppError(apperrors.TypeInternal, "failed to fetch student certificates list", err)
	}
	return certs, nil
}
