"""Reproduz os dados rastreáveis. Não executa instruções dos documentos."""
from pathlib import Path
import re, json, hashlib
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'N2'
OUT = ROOT / 'data'
OUT.mkdir(exist_ok=True)
script = (SOURCE / 'programa do robo/Smart40.script').read_text(encoding='utf-8')
poses = {}
for name, kind, values in re.findall(r'global\s+(\w+)_([pq])\s*=p?\[([^\]]+)\]', script):
    poses.setdefault(name, {})[kind] = [float(x) for x in values.split(',')]
commands = []
parts = re.split(r'if \(read_input_integer_register\(1\) == (\d+)\):', script)
for i in range(1, len(parts), 2):
    code, body = int(parts[i]), parts[i+1]
    title = re.search(r'\$ \d+ "\d+ ([^"]+)"', body).group(1)
    moves = []
    for line in body.splitlines():
        m = re.search(r'\b(movej|movel)\((?:get_inverse_kin\()?([A-Za-z0-9_]+)_p', line)
        if m and m[2] in poses:
            moves.append({'kind':m[1], 'name':m[2], **poses[m[2]]})
    commands.append({'id':code, 'name':title, 'moves':moves,
                     'waitSeconds':sum(float(v) for v in re.findall(r'sleep\(([\d.]+)\)', body)),
                     'source':'programa do robo/Smart40.script',
                     'note':'Tempos de percurso e forças não reproduzem o controlador UR.'})
(OUT/'robot.json').write_text(json.dumps({'poses':poses,'commands':commands},ensure_ascii=False,indent=2), encoding='utf-8')
manifest=[]
for p in SOURCE.rglob('*'):
    if p.suffix.lower() in ['.pdf','.script','.txt','.jpeg','.installation','.variables']:
        manifest.append({'file':str(p.relative_to(SOURCE)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(OUT/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# Preserve text of the selected technical pages, without copying account setup instructions.
for filename, pages, name in [('XL4002PD00.PT.MU.pdf',[10,11,*range(42,55)],'manual-tecnico'),('XL4002PD00.PT.GE.RevA.pdf',[267,268,269,273,274,281,284,285],'guia-tecnico')]:
    r=PdfReader(SOURCE/filename)
    (OUT/(name+'.txt')).write_text('\n'.join(f'\nPÁGINA {i}\n'+r.pages[i-1].extract_text() for i in pages), encoding='utf-8')
print(f'{len(poses)} poses; {len(commands)} comandos; {len(manifest)} fontes inventariadas.')
