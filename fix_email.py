import glob
import re

def fix_email_svc(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # u.emailSvc.*(ctx, ...) -> u.emailSvc.*(...)
    content = re.sub(r'(u\.emailSvc\.[A-Z]\w*)\(ctx, ', r'\1(', content)
    content = re.sub(r'(u\.emailSvc\.[A-Z]\w*)\(ctx\)', r'\1()', content)
    
    # Check audit_log_usecase.go:54 undefined ctx
    if 'audit_log_usecase.go' in filepath:
        content = content.replace('ctx, action', 'context.Background(), action')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    for uc in glob.glob('internal/usecase/*.go'):
        fix_email_svc(uc)
