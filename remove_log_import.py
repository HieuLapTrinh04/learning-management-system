import os
import re

def remove_log_import(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Use regex to find `"log"` in import blocks and remove it.
    # Be careful not to remove `"log/syslog"` or similar, but just exactly `"log"` or `"log"\n`
    # The safest way is line by line
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if line.strip() == '"log"':
            continue
        new_lines.append(line)
        
    content = '\n'.join(new_lines)
    
    # Remove standalone `import "log"`
    content = re.sub(r'^import\s+"log"\s*\n', '', content, flags=re.MULTILINE)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Removed unused log import from {filepath}")

def main():
    for root, dirs, files in os.walk('.'):
        if 'vendor' in dirs or '.git' in dirs:
            continue
        for file in files:
            if file.endswith('.go'):
                remove_log_import(os.path.join(root, file))

if __name__ == '__main__':
    main()
