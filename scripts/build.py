#!/usr/bin/env python3
"""Bundle the local game + precompiled Rust engine into one offline HTML file."""
from pathlib import Path
import base64
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'web'
wasm = (ROOT / 'engine' / 'perfect_pour_engine.wasm').read_bytes()
assert wasm[:8] == b'\x00asm\x01\x00\x00\x00', 'Invalid WebAssembly engine'
css = (source / 'style.css').read_text() + '\n' + (source / 'business.css').read_text()
art = (source / 'customer-art.js').read_text()
store_art = (source / 'storefront-art.js').read_text()
script = (source / 'game.js').read_text().replace('__WASM_BASE64__', base64.b64encode(wasm).decode())
html = (source / 'index.html').read_text()
html = html.replace('<!-- STYLE -->', '<style>\n' + css + '\n</style>')
html = html.replace('<!-- CUSTOMER_ART -->', '<script>\n' + art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- STOREFRONT_ART -->', '<script>\n' + store_art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- GAME_SCRIPT -->', '<script>\n' + script.replace('</script', '<\\/script') + '\n</script>')
assert '__WASM_BASE64__' not in html
assert '<!-- STYLE -->' not in html
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(html)
print(json.dumps({'file': str(dist / 'index.html'), 'bytes': len(html.encode()), 'sha256': hashlib.sha256(html.encode()).hexdigest(), 'wasm_bytes': len(wasm)}))
