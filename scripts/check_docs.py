#!/usr/bin/env python3
"""Valida estrutura do pacote; a inspeção visual dos PDFs continua necessária."""
from pathlib import Path
import json,zipfile
from pypdf import PdfReader
from PIL import Image
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'output/manifesto-documentacao.json').read_text())
for item in manifest['documentos']:
 path=root/'output/pdf'/item['arquivo'];pdf=PdfReader(str(path))
 assert len(pdf.pages)==item['paginas'],path
 assert all(len((page.extract_text() or '').strip())>30 for page in pdf.pages),path
 if item['arquivo'].startswith('01-'):
  assert len(pdf.pages)==4
  fonts={str(v.get_object().get('/BaseFont','')) for page in pdf.pages for v in page['/Resources']['/Font'].get_object().values()}
  assert any('Arial' in f for f in fonts),fonts
cases=json.loads((root/'docs/entrega/casos-de-uso.json').read_text())
assert [c['id'] for c in cases]==[f'UC{i:02}' for i in range(1,21)]
for case in cases:
 for ext in ['puml','png','svg']:assert (root/'docs/uml'/f"{case['id'].lower()}-sequencia.{ext}").is_file()
for p in (root/'docs/uml').glob('*.png'):
 with Image.open(p) as im:im.verify()
for p in (root/'docs/uml').glob('*.svg'):
 text=p.read_text();assert 'Syntax Error' not in text and 'syntax error' not in text,p
fields=json.loads((root/'docs/tecnica/dicionario-dados.json').read_text());assert len(fields)==7 and sum(map(len,fields.values()))==49
contracts=json.loads((root/'docs/tecnica/contratos-api.json').read_text());assert len(contracts)==25
archive=root/'output/entrega/AVS-Labs-3D-Documentacao-Entrega.zip'
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist();assert len([n for n in names if n.startswith('output/pdf/')])==7
 assert not any(n.startswith(('.run/','.git/','node_modules/')) or n.endswith('/.env') or n=='.env' for n in names)
 assert 'database/schema.sql' in names and 'docs/entrega/00-checklist-da-entrega.md' in names
print('OK: 7 PDFs, fase 1 com 4 páginas e Arial, 20 casos/sequências, 7 tabelas/49 campos, 25 endpoints e ZIP sem arquivos privados.')
