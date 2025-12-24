import re

# Đọc file
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Comment ASCII art
ascii_comment = '''/**
 

      _                _            _      _                            
  ___| |__   ___  __ _| |_ ___ _ __| |    | | _____      __   ___  __ _ 
 / __| '_ \ / _ \/ _` | __/ _ \ '__| |    | |/ _ \ \ /\ / /  / _ \/ _` |
| (__| | | |  __/ (_| | ||  __/ |  |_|    | | (_) \ V  V /  |  __/ (_| |
 \___|_| |_|\___|\__,_|\__\___|_|  (_)    |_|\___/ \_/\_/    \___|\__, |
                                                                     |_|

**/
'''

# Tách thành các dòng
lines = content.split('\n')
new_lines = []
code_line_count = 0
last_comment_pos = -20  # Để đảm bảo comment đầu tiên được thêm

for i, line in enumerate(lines):
    new_lines.append(line)
    
    # Đếm dòng code (bỏ qua comment và blank lines)
    stripped = line.strip()
    if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*') and not stripped.endswith('*/'):
        code_line_count += 1
        
        # Thêm comment mỗi 7-8 dòng code (ngẫu nhiên để khó đoán)
        if code_line_count - last_comment_pos >= 7:
            # Kiểm tra xem dòng tiếp theo có phải là comment không
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if not next_line.startswith('//') and not next_line.startswith('/*'):
                    new_lines.append('')
                    new_lines.append(ascii_comment)
                    last_comment_pos = code_line_count

# Ghi lại file
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("✅ Đã thêm comment ASCII art vào file App.jsx")