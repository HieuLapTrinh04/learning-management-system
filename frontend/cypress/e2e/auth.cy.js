describe('Authentication Flow', () => {
  beforeEach(() => {
    // Navigate to the login page before each test
    cy.visit('/login')
  })

  it('successfully loads the login page', () => {
    cy.get('h1').should('contain', 'Login')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
  })

  it('shows error on invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    // Assuming the application shows a toast or error message
    // Update this selector based on actual frontend implementation
    cy.contains('Invalid credentials').should('exist')
  })

  it('successfully logs in with valid credentials', () => {
    // Assuming there's a seeder user
    cy.get('input[type="email"]').type('admin@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // Assuming successful login redirects to dashboard
    cy.url().should('include', '/dashboard')
    // Wait for dashboard to load
    cy.contains('Dashboard').should('exist')
  })
})
