import glob
import re

def fix_usecase(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix double ctx: `ctx, ctx, ` -> `ctx, `
    content = content.replace('ctx, ctx,', 'ctx,')
    content = content.replace('ctx, ctx)', 'ctx)')
    
    # Also if the first argument was context.TODO(), it became ctx, context.TODO() -> this is valid syntax if we delete context.TODO()
    # Actually, wait, the method signature now is `LogEvent(ctx context.Context, ...)`
    # If the call is `u.auditSvc.LogEvent(ctx, context.TODO(), ...)` it will fail.
    # We can just replace `ctx, context.TODO(),` with `ctx,`
    content = content.replace('ctx, context.TODO(),', 'ctx,')
    content = content.replace('ctx, context.Background(),', 'ctx,')

    # Fix u.repo.Method() -> u.repo.Method(ctx)
    def call_repl(m):
        prefix = m.group(1) # u.repo.
        method = m.group(2) # GetAdminStats
        args = m.group(3) # id
        
        if args.startswith('ctx'):
            return m.group(0) # already has ctx
            
        if args.strip() == '':
            new_args = 'ctx'
        else:
            new_args = f'ctx, {args}'
            
        return f"{prefix}{method}({new_args})"
        
    content = re.sub(r'(u\.repo\.)([A-Z]\w*)\((.*?)\)', call_repl, content)
    
    # Wait, what if there are other usecase calls that were missed?
    # e.g., u.notificationSvc.Method()
    content = re.sub(r'(u\.\w+Svc\.)([A-Z]\w*)\((.*?)\)', call_repl, content)
    content = re.sub(r'(u\.\w+Service\.)([A-Z]\w*)\((.*?)\)', call_repl, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    for uc in glob.glob('internal/usecase/*.go'):
        fix_usecase(uc)
