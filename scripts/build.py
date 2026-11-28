#!/usr/bin/env python3
"""Bundle the local game + precompiled Rust engine into one offline HTML file."""
from pathlib import Path
import base64
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'web'
wasm = (ROOT / 'engine' / 'perfect_pour_engine.wasm').read_bytes()
assert wasm[:8] == b'\x00asm\x01\x00\x00\x00', 'Invalid WebAssembly engine'
assets = {
    path.stem.upper().replace('-', '_'): 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode()
    for path in sorted((source / 'assets').glob('*.webp'))
}

def embed_assets(value):
    for name, data in assets.items():
        value = value.replace('__ASSET_' + name + '__', data)
    return value

css = '\n'.join((source / name).read_text() for name in ['style.css', 'business.css', 'recipe.css', 'title.css', 'presentation.css'])
art = (source / 'customer-art.js').read_text()
store_art = (source / 'storefront-art.js').read_text()
music = (source / 'music.js').read_text()
sounds = (source / 'game-sounds.js').read_text()
cup_finish = (source / 'cup-finish.js').read_text()
recipe_art = (source / 'recipe-art.js').read_text()
control_flow = (source / 'control-flow.js').read_text()
pour_visuals = (source / 'pour-visuals.js').read_text()
script = (source / 'game.js').read_text().replace('__WASM_BASE64__', base64.b64encode(wasm).decode())
html = (source / 'index.html').read_text()
html = html.replace('<!-- STYLE -->', '<style>\n' + css + '\n</style>')
html = html.replace('<!-- ASSET_STYLE -->', '<style>:root{--bar-photo:url("__ASSET_BAR_INTERIOR__");--hero-photo:url("__ASSET_HERO_SODA__")}</style>')
html = html.replace('<!-- CUSTOMER_ART -->', '<script>\n' + art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- STOREFRONT_ART -->', '<script>\n' + store_art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- MUSIC_SCRIPT -->', '<script>\n' + music.replace('</script', '<\\/script') + '\n</script>\n<script>\n' + sounds.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- CUP_FINISH_SCRIPT -->', '<script>\n' + cup_finish.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- RECIPE_ART -->', '<script>\n' + recipe_art.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- CONTROL_FLOW -->', '<script>\n' + control_flow.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- POUR_VISUALS -->', '<script>\n' + pour_visuals.replace('</script', '<\\/script') + '\n</script>')
html = html.replace('<!-- GAME_SCRIPT -->', '<script>\n' + script.replace('</script', '<\\/script') + '\n</script>')
html = embed_assets(html)
assert '__WASM_BASE64__' not in html
assert '<!-- STYLE -->' not in html
assert not re.search(r'__ASSET_[A-Z_0-9]+__', html), 'An artwork asset was not embedded'
assert '<!-- POUR_VISUALS -->' not in html
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(html)
print(json.dumps({'file': str(dist / 'index.html'), 'bytes': len(html.encode()), 'sha256': hashlib.sha256(html.encode()).hexdigest(), 'wasm_bytes': len(wasm)}))
