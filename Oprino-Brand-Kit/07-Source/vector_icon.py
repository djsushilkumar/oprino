"""Resolution-independent pin/check master derived from the supplied reference."""
from pathlib import Path
import json

DATA=json.loads((Path(__file__).resolve().parent/'icon-vector-data.json').read_text())
FLAT={'navy':'#0F172A','blue':'#164CFF','black':'#000000','white':'#FFFFFF'}

def body(kind='color',prefix='symbol'):
    blue,green,dot=(DATA[k] for k in ('blue','green','dot'))
    if kind!='color':
        return f'<g fill="{FLAT[kind]}"><path d="{blue}"/><path d="{green}"/><path d="{dot}"/></g>'
    ids={k:prefix+'-'+k for k in ['blue','mint','depth','clip']}
    defs=f'''<defs>
<linearGradient id="{ids['blue']}" x1="0" y1="20" x2="410" y2="250" gradientUnits="userSpaceOnUse"><stop stop-color="#164CFC"/><stop offset="0.48" stop-color="#145CF6"/><stop offset="1" stop-color="#087DE5"/></linearGradient>
<linearGradient id="{ids['mint']}" x1="240" y1="390" x2="408" y2="275" gradientUnits="userSpaceOnUse"><stop stop-color="#20BAAA"/><stop offset="1" stop-color="#23BFA9"/></linearGradient>
<linearGradient id="{ids['depth']}" x1="90" y1="205" x2="200" y2="410" gradientUnits="userSpaceOnUse"><stop stop-color="#093CA7"/><stop offset="1" stop-color="#083096"/></linearGradient>
<clipPath id="{ids['clip']}"><path d="{blue}"/></clipPath></defs>'''
    shadows=''.join(f'<path d="{p}"/>' for p in DATA['shadows'])
    return defs+f'<circle cx="209.5" cy="208" r="201" fill="#FFFFFF"/><path d="{blue}" fill="url(#{ids["blue"]})"/><g clip-path="url(#{ids["clip"]})" fill="url(#{ids["depth"]})">{shadows}</g><path d="{green}" fill="url(#{ids["mint"]})"/><path d="{dot}" fill="#0655F0"/>'

def svg(kind='color'):
    return '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420"><title>Oprino pin and check - clean vector master</title>'+body(kind)+'</svg>'
