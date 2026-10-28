"""Create the runnable local delivery without dependencies or original manuals."""
from pathlib import Path
from shutil import copy2
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root / 'entrega' / 'N2-gemeo-digital-local.zip'
target.parent.mkdir(exist_ok=True)
excluded = {'.git', 'node_modules', 'entrega', 'demo-dist', 'visual-test-dist', '__pycache__'}
files = sorted(p for p in root.rglob('*') if p.is_file()
               and not (set(p.relative_to(root).parts) & excluded)
               and p.suffix not in {'.log', '.pyc'}
               and not p.name.startswith('.env'))
with ZipFile(target, 'w', ZIP_DEFLATED) as package:
    for file in files:
        package.write(file, file.relative_to(root))
with ZipFile(target) as package:
    assert package.testzip() is None
    assert 'dist/index.html' in package.namelist()
    assert 'web/laboratory.js' in package.namelist()
copy2(target, root.parent / target.name)
print(f'{len(files)} arquivos; ZIP validado: {target}')
