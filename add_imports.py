import os
import glob
import re

def add_import(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '"context"' not in content:
        # find the import block
        content = re.sub(r'import \(', 'import (\n\t"context"', content, count=1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == '__main__':
    for repo in glob.glob('internal/repository/*.go'):
        add_import(repo)
    for uc in glob.glob('internal/usecase/*.go'):
        add_import(uc)
