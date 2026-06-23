package utils

import (
	"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"

	"fmt"

	"github.com/resend/resend-go/v2"
)

type EmailService interface {
	SendRegistrationVerificationEmail(toEmail, toName, verificationToken, frontendURL string) error
	SendPasswordResetEmail(toEmail, toName, resetToken, frontendURL string) error
	SendCoursePurchaseEmail(toEmail, toName, courseName, amount string) error
	SendAssignmentReminderEmail(toEmail, toName, courseName, assignmentTitle, dueDate string) error
	SendCertificateIssuedEmail(toEmail, toName, courseName, certificateURL string) error
}

type emailService struct {
	client      *resend.Client
	fromAddress string
}

func NewEmailService(apiKey, fromAddress string) EmailService {
	client := resend.NewClient(apiKey)
	return &emailService{
		client:      client,
		fromAddress: fromAddress,
	}
}

func (s *emailService) sendEmail(toEmail, subject, htmlContent string) error {
	params := &resend.SendEmailRequest{
		From:    s.fromAddress,
		To:      []string{toEmail},
		Subject: subject,
		Html:    htmlContent,
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		logger.Log.Sugar().Infof("Failed to send email to %s: %v", toEmail, err)
		return err
	}
	logger.Log.Sugar().Infof("Email sent successfully to %s", toEmail)
	return nil
}

func (s *emailService) SendRegistrationVerificationEmail(toEmail, toName, verificationToken, frontendURL string) error {
	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", frontendURL, verificationToken)
	subject := "Xác thực tài khoản Online LMS"
	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Chào %s,</h2>
			<p>Cảm ơn bạn đã đăng ký tài khoản trên Online LMS.</p>
			<p>Vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
			<a href="%s" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác thực Email</a>
			<p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
			<p>Trân trọng,<br>Đội ngũ Online LMS</p>
		</div>
	`, toName, verifyLink)

	return s.sendEmail(toEmail, subject, html)
}

func (s *emailService) SendPasswordResetEmail(toEmail, toName, resetToken, frontendURL string) error {
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, resetToken)
	subject := "Yêu cầu đặt lại mật khẩu - Online LMS"
	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Chào %s,</h2>
			<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
			<p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
			<a href="%s" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại Mật khẩu</a>
			<p>Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
			<p>Trân trọng,<br>Đội ngũ Online LMS</p>
		</div>
	`, toName, resetLink)

	return s.sendEmail(toEmail, subject, html)
}

func (s *emailService) SendCoursePurchaseEmail(toEmail, toName, courseName, amount string) error {
	subject := "Xác nhận thanh toán thành công - Online LMS"
	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Chào %s,</h2>
			<p>Cảm ơn bạn đã mua khóa học <strong>%s</strong>.</p>
			<p>Thanh toán của bạn (<strong>%s VND</strong>) đã được ghi nhận thành công.</p>
			<p>Bạn có thể vào mục "Học tập của tôi" để bắt đầu học ngay bây giờ.</p>
			<p>Chúc bạn học tập thật tốt!</p>
			<p>Trân trọng,<br>Đội ngũ Online LMS</p>
		</div>
	`, toName, courseName, amount)

	return s.sendEmail(toEmail, subject, html)
}

func (s *emailService) SendAssignmentReminderEmail(toEmail, toName, courseName, assignmentTitle, dueDate string) error {
	subject := fmt.Sprintf("Bài tập mới: %s - %s", assignmentTitle, courseName)
	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Chào %s,</h2>
			<p>Có một bài tập mới trong khóa học <strong>%s</strong> của bạn.</p>
			<p><strong>Tiêu đề:</strong> %s</p>
			<p><strong>Hạn nộp:</strong> %s</p>
			<p>Đừng quên hoàn thành và nộp bài trước thời hạn nhé!</p>
			<p>Trân trọng,<br>Đội ngũ Online LMS</p>
		</div>
	`, toName, courseName, assignmentTitle, dueDate)

	return s.sendEmail(toEmail, subject, html)
}

func (s *emailService) SendCertificateIssuedEmail(toEmail, toName, courseName, certificateURL string) error {
	subject := "Chúc mừng bạn đã hoàn thành khóa học - Online LMS"
	html := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Tuyệt vời quá %s ơi! 🎉</h2>
			<p>Chúc mừng bạn đã xuất sắc hoàn thành khóa học <strong>%s</strong>.</p>
			<p>Sự nỗ lực của bạn đã được đền đáp. Bạn có thể xem và tải xuống chứng chỉ của mình tại nút bên dưới:</p>
			<a href="%s" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Xem Chứng Chỉ</a>
			<p>Chúc bạn tiếp tục gặt hái thêm nhiều thành công trên con đường học tập!</p>
			<p>Trân trọng,<br>Đội ngũ Online LMS</p>
		</div>
	`, toName, courseName, certificateURL)

	return s.sendEmail(toEmail, subject, html)
}
