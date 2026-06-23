import os
import re
import glob

def fix_broken_repo(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_interface = False
    for i, line in enumerate(lines):
        if 'interface {' in line:
            in_interface = True
            continue
        if in_interface and line.strip() == '}':
            in_interface = False
            continue
        
        if not in_interface and not line.startswith('func'):
            # This is a body line. Remove all `ctx context.Context, ` and `ctx context.Context` that got injected inside function calls.
            # But wait, we DO want `ctx` in u.repo.Create(ctx, ...). We didn't do that here though, the python script added `ctx context.Context`.
            # Let's remove `ctx context.Context, `
            lines[i] = lines[i].replace('ctx context.Context, ', '')
            lines[i] = lines[i].replace('ctx context.Context', '')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == '__main__':
    repos = glob.glob('internal/repository/*.go')
    for repo in repos:
        fix_broken_repo(repo)
