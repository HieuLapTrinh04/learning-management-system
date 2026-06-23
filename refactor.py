import os
import re
import glob

def refactor_repository(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add "context" to imports if not exists
    if '"context"' not in content and 'context.' in content:
        content = re.sub(r'import \(', 'import (\n\t"context"', content, count=1)

    # Replace interface definitions
    # Match lines like: \tCreate(course *models.Course) error
    def interface_repl(m):
        indent = m.group(1)
        name = m.group(2)
        args = m.group(3)
        ret = m.group(4)
        if args.strip() == '':
            new_args = 'ctx context.Context'
        else:
            new_args = f'ctx context.Context, {args}'
        return f"{indent}{name}({new_args}){ret}"
    
    content = re.sub(r'^(\s+)([A-Z]\w*)\((?!ctx context\.Context)(.*?)\)(.*)$', interface_repl, content, flags=re.MULTILINE)

    # Replace method definitions
    # Match lines like: func (r *courseRepository) Create(course *models.Course) error {
    def method_repl(m):
        receiver = m.group(1)
        name = m.group(2)
        args = m.group(3)
        ret = m.group(4)
        # Exclude constructor like NewCourseRepository or helper methods not starting with Capital letter
        if not name[0].isupper():
            return m.group(0)
        
        if args.strip() == '':
            new_args = 'ctx context.Context'
        else:
            new_args = f'ctx context.Context, {args}'
        return f"func ({receiver}) {name}({new_args}){ret} {{"

    content = re.sub(r'^func \((.*?)\) ([A-Z]\w*)\((?!ctx context\.Context)(.*?)\)(.*) \{$', method_repl, content, flags=re.MULTILINE)

    # Replace r.db. with r.db.WithContext(ctx).
    content = re.sub(r'r\.db\.(?!WithContext)', r'r.db.WithContext(ctx).', content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


def refactor_usecase(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # In usecases, we need to find all calls to u.*Repo.*(...) and inject ctx
    # E.g. u.courseRepo.GetByID(id) -> u.courseRepo.GetByID(ctx, id)
    # This is tricky because arguments could span multiple lines, but mostly they are single line.
    
    # Find calls like: u.somethingRepo.Method(args)
    # Be careful not to replace things that already have ctx as first arg.
    def call_repl(m):
        prefix = m.group(1) # u.courseRepo.
        method = m.group(2) # GetByID
        args = m.group(3) # id
        
        if args.startswith('ctx'):
            return m.group(0) # already has ctx
            
        if args.strip() == '':
            new_args = 'ctx'
        else:
            new_args = f'ctx, {args}'
            
        return f"{prefix}{method}({new_args})"
        
    content = re.sub(r'(u\.\w+Repo\.)([A-Z]\w*)\((.*?)\)', call_repl, content)
    # also for auditSvc? wait, auditSvc is a usecase, its methods also got updated?
    # No, auditSvc is an interface from usecase, so it might need ctx too.
    content = re.sub(r'(u\.auditSvc\.)([A-Z]\w*)\((.*?)\)', call_repl, content)
    # what about u.notificationUseCase?
    content = re.sub(r'(u\.\w+UseCase\.)([A-Z]\w*)\((.*?)\)', call_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    repos = glob.glob('internal/repository/*.go')
    for repo in repos:
        print(f"Refactoring {repo}")
        refactor_repository(repo)

    usecases = glob.glob('internal/usecase/*.go')
    for uc in usecases:
        print(f"Refactoring {uc}")
        refactor_usecase(uc)
