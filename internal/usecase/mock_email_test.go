package usecase

type MockEmailService struct {
	MockSendRegistrationVerificationEmail func(toEmail, toName, verificationToken, frontendURL string) error
	MockSendPasswordResetEmail            func(toEmail, toName, resetToken, frontendURL string) error
	MockSendCoursePurchaseEmail           func(toEmail, toName, courseName, amount string) error
	MockSendAssignmentReminderEmail       func(toEmail, toName, courseName, assignmentTitle, dueDate string) error
	MockSendCertificateIssuedEmail        func(toEmail, toName, courseName, certificateURL string) error
}

func (m *MockEmailService) SendRegistrationVerificationEmail(toEmail, toName, verificationToken, frontendURL string) error {
	if m.MockSendRegistrationVerificationEmail != nil {
		return m.MockSendRegistrationVerificationEmail(toEmail, toName, verificationToken, frontendURL)
	}
	return nil
}

func (m *MockEmailService) SendPasswordResetEmail(toEmail, toName, resetToken, frontendURL string) error {
	if m.MockSendPasswordResetEmail != nil {
		return m.MockSendPasswordResetEmail(toEmail, toName, resetToken, frontendURL)
	}
	return nil
}

func (m *MockEmailService) SendCoursePurchaseEmail(toEmail, toName, courseName, amount string) error {
	if m.MockSendCoursePurchaseEmail != nil {
		return m.MockSendCoursePurchaseEmail(toEmail, toName, courseName, amount)
	}
	return nil
}

func (m *MockEmailService) SendAssignmentReminderEmail(toEmail, toName, courseName, assignmentTitle, dueDate string) error {
	if m.MockSendAssignmentReminderEmail != nil {
		return m.MockSendAssignmentReminderEmail(toEmail, toName, courseName, assignmentTitle, dueDate)
	}
	return nil
}

func (m *MockEmailService) SendCertificateIssuedEmail(toEmail, toName, courseName, certificateURL string) error {
	if m.MockSendCertificateIssuedEmail != nil {
		return m.MockSendCertificateIssuedEmail(toEmail, toName, courseName, certificateURL)
	}
	return nil
}
