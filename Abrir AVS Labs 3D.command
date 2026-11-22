#!/bin/zsh
set -eu
export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
cd "${0:A:h}"
fail() { print "\nNão foi possível iniciar: $1"; print "Pressione Enter para fechar."; read -r; exit 1; }
trap 'print "\nO iniciador encontrou um erro. Confira a mensagem acima."; read -r "?Pressione Enter para fechar."' ZERR
print "AVS Labs 3D — iniciando…"
command -v node >/dev/null || fail "Node.js não está instalado."
command -v docker >/dev/null || fail "Docker Desktop não está instalado."
[[ -d node_modules ]] || fail "Execute npm ci na pasta do aplicativo antes da apresentação."
[[ -f .env ]] || cp .env.example .env
mkdir -p .run
port=$(node --input-type=module -e 'import "dotenv/config";const p=Number(process.env.PORT||3001);if(!Number.isInteger(p)||p<1024||p>65535)process.exit(1);console.log(p)')
url="http://127.0.0.1:$port"
if curl --silent --fail --max-time 2 "$url/api/health" >/dev/null 2>&1 && curl --silent --max-time 2 "$url" | /usr/bin/grep -q '<title>AVS Labs 3D'; then
  open "$url"
  print "O sistema já está aberto. Pode fechar esta janela."
  exit 0
fi
if ! docker info >/dev/null 2>&1; then
  print "Abrindo Docker Desktop. Aguarde…"
  open -a Docker
  ready=0
  for attempt in {1..90}; do
    if docker info >/dev/null 2>&1; then ready=1; break; fi
    sleep 2
  done
  [[ "$ready" == 1 ]] || fail "Docker não ficou pronto. Abra o Docker Desktop e tente novamente."
fi
print "Preparando PostgreSQL…"
docker compose up -d --wait --wait-timeout 120
npm run db:setup
print "Preparando a interface…"
npm run build
print "Abrindo o sistema…"
nohup node server/index.js >> .run/servidor.log 2>&1 < /dev/null &
server_pid=$!
print "$server_pid" > .run/servidor.pid
ready=0
for attempt in {1..30}; do
  if curl --silent --fail --max-time 2 "$url/api/health" >/dev/null 2>&1; then ready=1; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    tail -n 15 .run/servidor.log
    fail "O servidor encerrou. Confira as mensagens acima."
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || fail "O servidor não respondeu. Consulte .run/servidor.log."
open "$url"
print "\nPronto! $url"
print "Pode fechar esta janela. O aplicativo continuará funcionando."
