import os
import re

def replace_log_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace log.Println -> logger.Log.Info
    content = re.sub(r'\blog\.Println\(', 'logger.Log.Sugar().Infoln(', content)
    # Replace log.Printf -> logger.Log.Sugar().Infof
    content = re.sub(r'\blog\.Printf\(', 'logger.Log.Sugar().Infof(', content)
    # Replace log.Fatalf -> logger.Log.Sugar().Fatalf
    content = re.sub(r'\blog\.Fatalf\(', 'logger.Log.Sugar().Fatalf(', content)
    # Replace log.Fatal -> logger.Log.Sugar().Fatal
    content = re.sub(r'\blog\.Fatal\(', 'logger.Log.Sugar().Fatal(', content)
    # Replace log.Print -> logger.Log.Sugar().Info
    content = re.sub(r'\blog\.Print\(', 'logger.Log.Sugar().Info(', content)

    if content != original_content:
        # Add import if missing
        if 'github.com/HieuLapTrinh04/learning-management-system/pkg/logger' not in content:
            # simple import addition (goimports will clean it up later)
            content = re.sub(r'import \(', 'import (\n\t"github.com/HieuLapTrinh04/learning-management-system/pkg/logger"\n', content, count=1)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    for root, dirs, files in os.walk('.'):
        if 'vendor' in dirs:
            dirs.remove('vendor')
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            if file.endswith('.go') and file != 'logger.go':
                replace_log_in_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
