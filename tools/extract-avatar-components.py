#!/usr/bin/env python3
"""Extrai primitivas SVG AUTÊNTICAS do catálogo Kids Avatars para o bundle offline.

Uso: python3 tools/extract-avatar-components.py
Os índices e cores são declarados em assets/avatar-reference/component-map.json.
"""
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets/avatar-reference'
MAP = json.loads((ASSETS / 'component-map.json').read_text(encoding='utf-8'))
SOURCE_DIR = ASSETS / 'svgrepo-kids'
TARGET = ROOT / 'assets/js/avatar-parts.js'
ALLOWED_TAGS = {'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'}


def extract(source, indices, colors):
    """Copia elementos XML sem redesenhar ou simplificar curvas do arquivo original."""
    source_path = SOURCE_DIR / source
    elements = list(ET.parse(source_path).getroot().iter())
    pieces = []
    for index in indices:
        node = elements[index]
        tag = node.tag.split('}')[-1]
        if tag not in ALLOWED_TAGS:
            raise ValueError(f'{source}: índice {index} não é uma forma SVG ({tag})')
        attributes = []
        for key, value in node.attrib.items():
            attr = key.split('}')[-1]
            for hex_color, token in colors.items():
                value = re.sub(re.escape(hex_color) + r'\b', '{{' + token + '}}', value, flags=re.I)
            attributes.append(f'{attr}="{value.replace("&", "&amp;").replace(chr(34), "&quot;")}"')
        pieces.append(f'<{tag} {" ".join(attributes)}/>')
    return ''.join(pieces)


def build(check=False):
    base = MAP['base']
    output = {'face': {'source': base['source'], 'svg': extract(base['source'], base['nodes'], base['colors'])},
              'hair': {}, 'outfit': {}}
    for name, info in MAP['hair'].items():
        output['hair'][name] = {
            'source': info['source'],
            'back': extract(info['source'], info['back'], info['colors']),
            'front': extract(info['source'], info['front'], info['colors'])
        }
    for name, info in MAP['outfit'].items():
        output['outfit'][name] = {
            'source': info['source'],
            'svg': extract(info['source'], info['nodes'], info['colors'])
        }
    header = ('/* GERADO de assets/avatar-reference/svgrepo-kids/*.svg. '
              'NÃO redesenhar estas peças; edite component-map.json e execute o extrator. */\n')
    content = header + 'window.LivrinhoAvatarParts = ' + json.dumps(
        output, ensure_ascii=False, separators=(',', ':')) + ';\n'
    if check:
        if not TARGET.is_file() or TARGET.read_text(encoding='utf-8') != content:
            raise SystemExit('O pacote de SVGs está desatualizado: regenere com tools/extract-avatar-components.py')
    else:
        TARGET.write_text(content, encoding='utf-8')
    print(f'Extraídos {len(output["hair"])} penteados e {len(output["outfit"])} roupas de SVGs reais: {TARGET}')


if __name__ == '__main__':
    build(check='--check' in sys.argv)
