import re, sys, os
src, dst = sys.argv[1], sys.argv[2]
base = os.path.dirname(src); html = open(src, encoding='utf-8').read()
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + open(os.path.join(base, m.group(1)), encoding='utf-8').read() + '\n</style>', html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + open(os.path.join(base, m.group(1)), encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>', html)
open(dst, 'w', encoding='utf-8').write(html)
