#!/usr/bin/env python3
"""Mantém descrições formais e sequências alinhadas aos vinte casos de uso em JSON."""
from pathlib import Path
import json,re,textwrap
root=Path(__file__).resolve().parents[1]
cases=json.loads((root/'docs/entrega/casos-de-uso.json').read_text())
assert len(cases)==20 and len({c['id'] for c in cases})==20
path=root/'docs/entrega/02-modelagem-uml.md';text=path.read_text()
prefix=text.split('## Descrições essenciais e sequências')[0]
parts=[prefix,'''## Descrições essenciais e sequências

As sequências mostram o fluxo principal e as condições relevantes. Fragmentos break encerram o fluxo em falha; consultas auxiliares da interface foram omitidas. Cada caso corresponde a um evento externo do operador.
''']
for c in cases:
 parts.append(f"## {c['id']} - {c['title']}\n\n**Ator:** Operador. **Tipo:** externo. **Estímulo:** {c['trigger']}\n\n**Entrada:** {c['inputs']}\n\n**Pré-condições:** {c['pre']}\n\n**Pós-condições:** {c['post']}\n\n**Interface de implementação:** `{c['api']}`.\n\n**Dados envolvidos:** {c['db']}.\n\n### Fluxo principal\n\n"+'\n'.join(f'{i}. {step}' for i,step in enumerate(c['steps'],1))+'\n\n### Fluxos alternativos e exceções\n\n'+'\n'.join('- '+a for a in c['alternatives'])+f"\n\n### Diagrama de sequência\n\n![{c['id']}](../uml/{c['id'].lower()}-sequencia.png)\n")
 p=root/'docs/uml'/f"{c['id'].lower()}-sequencia.puml"
 header=p.read_text().split('Operador -> UI:')[0]
 sequence=f"Operador -> UI: {c['trigger']}\n"+c['sequence']+'\nUI --> Operador: Resultado ou mensagem de impedimento\n@enduml\n'
 lines=[]
 for line in sequence.splitlines():
  if re.match(r'\w+\s*[-.<>]+\s*\w+\s*:',line.strip()):
   left,message=line.split(':',1);line=left+': '+'\\n'.join(textwrap.wrap(message.strip(),width=43))
  lines.append(line)
 p.write_text(header+'\n'.join(lines)+'\n')
path.write_text('\n\n'.join(parts).strip()+'\n')
print('Descrições e vinte sequências sincronizadas. Renderize UML antes de gerar PDFs.')
