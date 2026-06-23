import glob
import re

def fix_mocks(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add context to imports if not exists
    if '"context"' not in content and 'context.' in content:
        content = re.sub(r'import \(', 'import (\n\t"context"', content, count=1)

    # Match lines like: func (m *MockUserRepository) Create(user *models.User) error {
    def method_repl(m):
        receiver = m.group(1)
        name = m.group(2)
        args = m.group(3)
        ret = m.group(4)
        
        # Don't add if already has context
        if args.startswith('ctx context.Context'):
            return m.group(0)
            
        if args.strip() == '':
            new_args = 'ctx context.Context'
        else:
            new_args = f'ctx context.Context, {args}'
        return f"func ({receiver}) {name}({new_args}){ret} {{"

    content = re.sub(r'^func \((m \*Mock[A-Z]\w*)\) ([A-Z]\w*)\((?!ctx context\.Context)(.*?)\)(.*) \{$', method_repl, content, flags=re.MULTILINE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    for testfile in glob.glob('internal/usecase/*_test.go'):
        fix_mocks(testfile)
