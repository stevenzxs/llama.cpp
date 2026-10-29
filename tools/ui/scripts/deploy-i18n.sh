#!/bin/sh
set -eu

cd /opt/llama-b11972
release=webui-i18n-20261029
backup=llama-b11972-before-i18n-20261029
test -f "$release/index.html"
test ! -e start.sh.before-i18n-20261029
! docker container inspect "$backup" >/dev/null 2>&1
curl -fsS http://192.168.199.202:18080/slots | python3 -c 'import json,sys; assert not any(s["is_processing"] for s in json.load(sys.stdin)), "Inference is busy"'
docker inspect llama-b11972 > container-before-i18n-20261029.json
cp -p start.sh start.sh.before-i18n-20261029
python3 - <<'PY'
from pathlib import Path
p = Path('start.sh')
s = p.read_text()
assert '-v /opt/llama-b11972/models:/models:ro' in s
assert '--ui-mcp-proxy --host' in s
s = s.replace('-v /opt/llama-b11972/models:/models:ro', '-v /opt/llama-b11972/webui-i18n-20261029:/webui:ro -v /opt/llama-b11972/models:/models:ro')
s = s.replace('--ui-mcp-proxy --host', '--path /webui --ui-mcp-proxy --host')
Path('start-i18n.sh').write_text(s)
PY
docker stop llama-b11972
docker rename llama-b11972 "$backup"
if sh start-i18n.sh; then
  for attempt in $(seq 1 60); do
    if curl -fsS http://192.168.199.202:18080/health; then
      cp start-i18n.sh start.sh
      exit 0
    fi
    sleep 2
  done
fi
docker stop llama-b11972 || true
docker rename llama-b11972 llama-b11972-i18n-failed-20261029
docker rename "$backup" llama-b11972
docker start llama-b11972
exit 1
