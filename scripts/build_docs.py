#!/usr/bin/env python3
"""Gera PDFs da entrega a partir de Markdown/JSON e figuras UML versionadas.

Não acessa nem altera o banco. Arial real é exigida para a fase 1.
As fontes de conteúdo permanecem em docs; output contém apenas derivados.
"""
from pathlib import Path
import html, json, os, re, textwrap, zipfile, hashlib
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4, A3, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle, Preformatted, KeepTogether
from markdown_it import MarkdownIt
from PIL import Image as PILImage
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
FONT_DIR=Path(os.environ.get('ARIAL_FONT_DIR','/System/Library/Fonts/Supplemental'))
for name,filename in [('Arial','Arial.ttf'),('Arial-Bold','Arial Bold.ttf'),('Arial-Italic','Arial Italic.ttf'),('Arial-BoldItalic','Arial Bold Italic.ttf'),('Code','Courier New.ttf')]:
 path=FONT_DIR/filename
 if not path.exists():
  if name=='Code':continue
  raise SystemExit(f'Fonte Arial necessária: {path}. Defina ARIAL_FONT_DIR para uma pasta com os arquivos TTF.')
 pdfmetrics.registerFont(TTFont(name,str(path)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-BoldItalic')
CODE='Code' if 'Code' in pdfmetrics.getRegisteredFontNames() else 'Courier'
BLUE=colors.HexColor('#225b85');GRAY=colors.HexColor('#647181');LINE=colors.HexColor('#d9dfe5')
W=A4[0]-110
STYLE={
 'body':ParagraphStyle('body',fontName='Arial',fontSize=10,leading=14.5,spaceAfter=8,textColor=colors.HexColor('#24313e'),splitLongWords=True,allowWidows=0,allowOrphans=0),
 'h1':ParagraphStyle('h1',fontName='Arial-Bold',fontSize=20,leading=25,spaceAfter=16,textColor=BLUE,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='Arial-Bold',fontSize=14,leading=18,spaceBefore=13,spaceAfter=9,textColor=BLUE,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='Arial-Bold',fontSize=11,leading=15,spaceBefore=9,spaceAfter=6,textColor=BLUE,keepWithNext=True),
 'cell':ParagraphStyle('cell',fontName='Arial',fontSize=8.3,leading=11,spaceAfter=0,splitLongWords=True),
 'caption':ParagraphStyle('caption',fontName='Arial-Italic',fontSize=8,leading=11,spaceAfter=12,textColor=GRAY,alignment=TA_CENTER),
 'phase':ParagraphStyle('phase',fontName='Arial',fontSize=12,leading=18,spaceAfter=9,alignment=TA_JUSTIFY),
 'phaseh':ParagraphStyle('phaseh',fontName='Arial-Bold',fontSize=12,leading=18,spaceAfter=10,keepWithNext=True),
 'code':ParagraphStyle('code',fontName=CODE,fontSize=7.5,leading=10,spaceBefore=4,spaceAfter=10,borderPadding=8,backColor=colors.HexColor('#f4f6f8')),
}
MD=MarkdownIt('commonmark').enable('table')
DOC_TITLE='AVS Labs 3D'

def inline(token):
 out=[]
 for t in token.children or []:
  if t.type=='text':out.append(escape(t.content))
  elif t.type in ('softbreak','hardbreak'):out.append('<br/>')
  elif t.type=='code_inline':out.append('<font name="'+CODE+'">'+escape(t.content)+'</font>')
  elif t.type=='strong_open':out.append('<b>')
  elif t.type=='strong_close':out.append('</b>')
  elif t.type=='em_open':out.append('<i>')
  elif t.type=='em_close':out.append('</i>')
  elif t.type=='link_open':
   href=t.attrGet('href') or '';out.append('<link href="'+escape(href,{'"':'&quot;'})+'">' if href.startswith(('http:','https:')) else '')
  elif t.type=='link_close':
   # Markdown source paths remain readable text; external links are optional in the PDF.
   if out and any('<link ' in x for x in out) and sum(x.count('<link ') for x in out)>sum(x.count('</link>') for x in out):out.append('</link>')
  elif t.type=='image':out.append(escape(t.content))
 return ''.join(out)

def figure(src,base,max_h=575):
 path=(base/src).resolve()
 if not path.is_file():raise FileNotFoundError(path)
 iw,ih=PILImage.open(path).size
 ratio=min(W/iw,max_h/ih)
 return Image(str(path),width=iw*ratio,height=ih*ratio,hAlign='CENTER')

def markdown_story(text,base,phase=False):
 tokens=MD.parse(text);story=[];i=0;lists=[]
 while i<len(tokens):
  t=tokens[i]
  if t.type=='heading_open':
   content=inline(tokens[i+1]);level=int(t.tag[1]);
   if not phase and re.match(r'^UC\d{2} - ',content) and story and not isinstance(story[-1],PageBreak):story.append(PageBreak())
   style=STYLE['phaseh'] if phase else STYLE['h'+str(min(level,3))]
   story.append(Paragraph(content,style));i+=3;continue
  if t.type in ('bullet_list_open','ordered_list_open'):
   lists.append({'ordered':t.type=='ordered_list_open','n':int(t.attrGet('start') or 1)});i+=1;continue
  if t.type in ('bullet_list_close','ordered_list_close'):
   if lists:lists.pop()
   i+=1;continue
  if t.type=='paragraph_open':
   tok=tokens[i+1]
   images=[x for x in (tok.children or []) if x.type=='image']
   if images and len(tok.children)==1:
    image=images[0];story.append(KeepTogether([Spacer(1,8),figure(image.attrGet('src'),base),Paragraph(escape(image.content),STYLE['caption'])]))
   else:
    content=inline(tok)
    if lists:
     item=lists[-1];prefix=(str(item['n'])+'. ') if item['ordered'] else '• '
     if item['ordered']:item['n']+=1
     content=prefix+content
    story.append(Paragraph(content,STYLE['phase'] if phase else STYLE['body']))
   i+=3;continue
  if t.type=='fence':
   # Quebra visível para que código e URLs longos não ultrapassem a área de texto.
   lines=[]
   for line in t.content.splitlines():
    lines.extend(textwrap.wrap(line,100,replace_whitespace=False,drop_whitespace=False) or [''])
   story.append(Preformatted('\n'.join(lines),STYLE['code']));i+=1;continue
  if t.type=='table_open':
   rows=[];row=[];j=i+1
   while j<len(tokens) and tokens[j].type!='table_close':
    q=tokens[j]
    if q.type=='tr_open':row=[]
    elif q.type in ('th_open','td_open'):
     cell=inline(tokens[j+1]);row.append(Paragraph(cell,STYLE['cell']))
    elif q.type=='tr_close':rows.append(row)
    j+=1
   count=max(len(r) for r in rows)
   proportions={2:[.26,.74],3:[.22,.27,.51],4:[.18,.23,.12,.47],5:[.08,.18,.18,.28,.28],6:[.09,.17,.10,.18,.27,.19]}.get(count,[1/count]*count)
   table=Table(rows,colWidths=[W*v for v in proportions],repeatRows=1,hAlign='LEFT')
   table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eaf0f5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.6,LINE),('LINEBELOW',(0,1),(-1,-1),.3,LINE),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
   story.extend([table,Spacer(1,12)]);i=j+1;continue
  if t.type=='html_block' and 'PAGEBREAK' in t.content:story.append(PageBreak())
  i+=1
 return story

def footer(c,doc):
 c.saveState();width,height=doc.pagesize
 c.setStrokeColor(LINE);c.line(55,41,width-55,41)
 c.setFont('Arial',8);c.setFillColor(GRAY);c.drawString(55,27,'AVS Labs 3D | '+DOC_TITLE[:64]);c.drawRightString(width-55,27,str(doc.page));c.restoreState()

def cover(title,subtitle):
 logo=ROOT/'public/brand/avs-labs-3d.png';iw,ih=PILImage.open(logo).size
 return [Spacer(1,65),Image(str(logo),width=185,height=185*ih/iw,hAlign='LEFT'),Spacer(1,45),Paragraph(escape(title),STYLE['h1']),Paragraph(escape(subtitle),STYLE['body']),Spacer(1,22),Paragraph('Sistema de gestão de estoque, produção e vendas<br/>Documentação da implementação local | 2026/02',STYLE['body']),PageBreak()]

def write_pdf(filename,story,title):
 global DOC_TITLE
 DOC_TITLE=title
 doc=SimpleDocTemplate(str(OUT/filename),pagesize=A4,leftMargin=55,rightMargin=55,topMargin=48,bottomMargin=55,title='AVS Labs 3D - '+title,author='AVS Labs 3D',allowSplitting=1)
 doc.build(story,onFirstPage=footer,onLaterPages=footer)
 return len(PdfReader(str(OUT/filename)).pages)

# Dados institucionais ficam separados das informações técnicas verificadas.
metadata=json.loads((ROOT/'docs/entrega/dados-do-trabalho.json').read_text())
phase_path=ROOT/'docs/entrega/01-caracterizacao-da-empresa.md';phase=phase_path.read_text()
replacements={'[PREENCHER INSTITUIÇÃO]':'instituicao','[PREENCHER GRUPO]':'integrantes','[PREENCHER CIDADE E UF]':'cidade','[PREENCHER ANO OU DATA APROXIMADA]':'inicio_atividades','[PREENCHER PRINCIPAIS PRODUTOS E NECESSIDADES ATENDIDAS]':'produtos','[PREENCHER CONCORRENTES LOCAIS OU DIGITAIS E DIFERENCIAIS]':'concorrentes','[PREENCHER COMO ERAM FEITOS CADASTROS, CONTAGENS, PLANEJAMENTO E REGISTRO DE VENDAS]':'procedimentos_anteriores','[PREENCHER RESPONSÁVEIS]':'socios','[PREENCHER QUANTIDADE DE PESSOAS]':'quantidade_pessoas','[PREENCHER FILIAIS]':'filiais'}
for marker,key in replacements.items():
 value=metadata.get(key)
 if value is not None:phase=phase.replace(marker,', '.join(value) if isinstance(value,list) else str(value))
pages=write_pdf('01-Fase-1-Empresa-e-Proposta.pdf',markdown_story(phase,phase_path.parent,phase=True),'Fase 1 - Empresa e proposta')
if pages!=4:raise SystemExit(f'A fase 1 deve ter exatamente 4 páginas; geradas {pages}. Ajuste o conteúdo sem mudar Arial 12 / entrelinha 18.')
results=[('01-Fase-1-Empresa-e-Proposta.pdf',pages)]
for src,filename,title in [('02-modelagem-uml.md','02-Fase-2-Modelagem-UML.pdf','Fase 2 - Modelagem UML'),('03-modelo-de-dados.md','03-Fase-3-Banco-de-Dados.pdf','Fase 3 - Banco de dados'),('04-implementacao-e-apresentacao.md','04-Fase-4-Apresentacao.pdf','Fase 4 - Implementação e apresentação')]:
 path=ROOT/'docs/entrega'/src
 results.append((filename,write_pdf(filename,cover(title,'Requisitos da disciplina e correspondência com o aplicativo')+markdown_story(path.read_text(),path.parent),title)))
tech=cover('Documentação técnica completa','Stack, arquitetura, regras, banco, API, operação, testes e rastreabilidade')
for index,path in enumerate(sorted((ROOT/'docs/tecnica').glob('[0-9][0-9]-*.md'))):
 if index:tech.append(PageBreak())
 tech+=markdown_story(path.read_text(),path.parent)
results.append(('05-Documentacao-Tecnica-Completa.pdf',write_pdf('05-Documentacao-Tecnica-Completa.pdf',tech,'Documentação técnica completa')))
manual=ROOT/'docs/tecnica/06-manual-do-usuario.md'
results.append(('06-Manual-do-Usuario.pdf',write_pdf('06-Manual-do-Usuario.pdf',cover('Manual do usuário','Operação cotidiana do cadastro à exportação')+markdown_story(manual.read_text(),manual.parent),'Manual do usuário')))
# Atlas com páginas A3 para preservar leitura de diagramas detalhados.
atlas=OUT/'07-Atlas-Diagramas-UML.pdf';c=canvas.Canvas(str(atlas));c.setTitle('AVS Labs 3D - Atlas UML');c.setAuthor('AVS Labs 3D')
for index,path in enumerate(sorted((ROOT/'docs/uml').glob('*.png')),1):
 iw,ih=PILImage.open(path).size;size=A3 if ih/iw>1.2 else landscape(A3);c.setPageSize(size);width,height=size
 c.setFont('Arial-Bold',13);c.setFillColor(BLUE);c.drawString(35,height-30,'AVS Labs 3D | '+path.stem)
 scale=min((width-70)/iw,(height-90)/ih);pw,ph=iw*scale,ih*scale
 c.drawImage(str(path),(width-pw)/2,(height-ph)/2-6,width=pw,height=ph,mask='auto')
 c.setFont('Arial',8);c.setFillColor(GRAY);c.drawString(35,23,'Fonte editável: docs/uml/'+path.with_suffix('.puml').name);c.drawRightString(width-35,23,str(index));c.showPage()
c.save();results.append((atlas.name,len(PdfReader(str(atlas)).pages)))

summary={'documentos':[{'arquivo':n,'paginas':p} for n,p in results],'casos_de_uso':20,'sequencias':len(list((ROOT/'docs/uml').glob('uc*-sequencia.puml'))),'campos_cadastrais_pendentes':[k for k,v in metadata.items() if v is None],'fase1_fonte':'Arial 12','fase1_entrelinha_pt':18}
(ROOT/'output/manifesto-documentacao.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
archive=ROOT/'output/entrega/AVS-Labs-3D-Documentacao-Entrega.zip';archive.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for directory in ['docs/entrega','docs/tecnica','docs/uml','docs/imagens','output/pdf','database']:
  for p in sorted((ROOT/directory).rglob('*')):
   if p.is_file():z.write(p,p.relative_to(ROOT))
 for name in ['README.md','package.json','package-lock.json','output/manifesto-documentacao.json','requirements-docs.txt','scripts/build_docs.py','scripts/render-uml.sh','scripts/sync_case_docs.py','scripts/check_docs.py','docs/README.md','docs/validacao.md']:
  p=ROOT/name
  if p.exists():z.write(p,name)
print(json.dumps(summary,ensure_ascii=False,indent=2));print('Pacote:',archive)
