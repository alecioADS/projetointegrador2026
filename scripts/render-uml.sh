#!/bin/sh
# Renderizador local: baixar PlantUML da distribuição oficial e informar o caminho do JAR.
# Exemplo: PLANTUML_JAR=/caminho/plantuml.jar sh scripts/render-uml.sh
set -eu
: "${PLANTUML_JAR:?Defina PLANTUML_JAR com o caminho do PlantUML oficial.}"
cd "$(dirname "$0")/.."
java -Djava.awt.headless=true -jar "$PLANTUML_JAR" -tpng -charset UTF-8 docs/uml/*.puml
java -Djava.awt.headless=true -jar "$PLANTUML_JAR" -tsvg -charset UTF-8 docs/uml/*.puml
