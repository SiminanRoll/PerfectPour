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
css = '\n'.join((source / name).read_text() for name in ['style.css', 'business.css', 'recipe.css', 'title.css', 'bar-scene.css', 'tycoon.css'])
art = (source / 'customer-art.js').read_text()
store_art = (source / 'storefront-art.js').read_text()
music = (source / 'music.js').read_text()
sounds = (source / 'game-sounds.js').read_text()
cup_finish = (source / 'cup-finish.js').read_text()
recipe_art = (source / 'recipe-art.js').read_text()
control_flow = (source / 'control-flow.js').read_text()
bar_liquid = (source / 'bar-liquid.js').read_text()
script = (source / 'game.js').read_text().replace('__WASM_BASE64__', base64.b64encode(wasm).decode())
html = (source / 'index.html').read_text()
html = html.replace('<!-- STYLE -->', '<style>\n' + css + '\n</style>')
html = html.replace('<!-- CUSTOMER_ART -->', '<script>\n' + art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- STOREFRONT_ART -->', '<script>\n' + store_art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- MUSIC_SCRIPT -->', '<script>\n' + music.replace('</script', '<\\/script') + '\n</script>\n<script>\n' + sounds.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- CUP_FINISH_SCRIPT -->', '<script>\n' + cup_finish.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- RECIPE_ART -->', '<script>\n' + recipe_art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- CONTROL_FLOW -->', '<script>\n' + control_flow.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- GAME_SCRIPT -->', '<script>\n' + bar_liquid.replace('</script', '<\\/script') + '\n</script>\n<script>\n' + script.replace('</script', '<\\/script') + '\n</script>')
assert '__WASM_BASE64__' not in html
assert '<!-- STYLE -->' not in html
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(html)
print(json.dumps({'file': str(dist / 'index.html'), 'bytes': len(html.encode()), 'sha256': hashlib.sha256(html.encode()).hexdigest(), 'wasm_bytes': len(wasm)}))
