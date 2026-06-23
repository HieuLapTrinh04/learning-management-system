import glob
import re

def fix_test_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add context import if missing
    if 'context.' in content and '"context"' not in content:
        # handle multiple import blocks or single import
        content = re.sub(r'import \(', 'import (\n\t"context"', content, count=1)
        if '"context"' not in content:
            content = re.sub(r'import "', 'import (\n\t"context"\n)\nimport "', content, count=1)

    # 2. Fix the RunRetentionCron in mock_audit_log
    # Because we added ctx context.Context to it earlier by mistake, let's revert it.
    content = content.replace('func (m *MockAuditLogUseCase) RunRetentionCron(ctx context.Context, days int)', 'func (m *MockAuditLogUseCase) RunRetentionCron(days int)')

    # 3. Fix CreateEmailVerificationToken in mock_email_test.go or auth_usecase_test.go
    # Check if there are methods in Mock* that missed `ctx context.Context`
    # Let's just find `func (m *Mock\w+Repository) \w+\((?!ctx context\.Context)`
    def repl(m):
        prefix = m.group(1) # `func (m *MockUserRepository) Create(`
        args = m.group(2) # `user *models.User`
        suffix = m.group(3) # `) error {`
        if args.strip() == '':
            new_args = 'ctx context.Context'
        else:
            new_args = f'ctx context.Context, {args}'
        return f"{prefix}{new_args}{suffix}"

    content = re.sub(r'(func \([^)]+\*[Mm]ock\w+Repository\) \w+\()(?!\s*ctx context\.Context)(.*?)(\)\s*.*?\{)', repl, content)
    content = re.sub(r'(func \([^)]+\*[Mm]ock\w+Service\) \w+\()(?!\s*ctx context\.Context)(.*?)(\)\s*.*?\{)', repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    for file in glob.glob('internal/usecase/*.go'):
        if file.endswith('_test.go'):
            fix_test_file(file)
