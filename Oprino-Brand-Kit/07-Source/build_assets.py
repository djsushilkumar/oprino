from pathlib import Path
import sys, os, json, shutil, math, zipfile, base64, hashlib
from xml.sax.saxutils import escape
from io import BytesIO
from PIL import Image
import vector_icon as VECTOR

BASE = Path(__file__).resolve().parents[2]
WORK = BASE / 'oprino_brand_work'
ROOT = BASE / 'Oprino-Brand-Kit'
FONTS = ROOT / '06-Fonts'
ICON_SOURCE = ROOT / '07-Source/original-icon'
WORK.mkdir(parents=True, exist_ok=True)
for folder in ['01-Logos/SVG', '01-Logos/PNG', '01-Logos/PDF', '02-Digital/Favicons', '02-Digital/4K',
               '03-Templates', '04-Guidelines', '05-Design-Tokens', '06-Fonts']:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

conf = WORK / 'fonts.conf'
conf.write_text('<fontconfig><dir>'+str(FONTS)+'</dir><include ignore_missing="yes">/etc/fonts/fonts.conf</include><cachedir>'+str(WORK/'font-cache')+'</cachedir></fontconfig>')
os.environ['FONTCONFIG_FILE'] = str(conf)
sys.path.insert(0, str(WORK / 'dependencies'))
import cairosvg
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

COLORS = {
 'navy':'#0F172A', 'cobalt':'#164CFF', 'ocean':'#087DE5',
 'mint':'#20BAAA', 'deep-blue':'#1235A4', 'slate':'#475569',
 'paper':'#F8FAFC', 'white':'#FFFFFF', 'border':'#DDE5EF',
}
font = TTFont(str(FONTS / 'Unbounded-Medium.ttf'))
gs = font.getGlyphSet(); cmap=font.getBestCmap()
paths=[]; x=0; boxes=[]
for ch in 'oprino':
    name=cmap[ord(ch)]; pen=SVGPathPen(gs); gs[name].draw(pen)
    paths.append((x, pen.getCommands()))
    bp=BoundsPen(gs); gs[name].draw(bp)
    boxes.append((x+bp.bounds[0],bp.bounds[1],x+bp.bounds[2],bp.bounds[3]))
    x += font['hmtx'][name][0] - 0.012 * font['head'].unitsPerEm
WORD_BOUNDS=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
SCALE=152/(WORD_BOUNDS[3]-WORD_BOUNDS[1])
WORD_WIDTH=(WORD_BOUNDS[2]-WORD_BOUNDS[0])*SCALE

# Smooth, resolution-independent contours traced from the supplied pin/check.
# The original screenshot and crop are retained unmodified for provenance.

def defs(prefix='logo'):
    return ''

def icon(x=0,y=0,size=200,kind='color',prefix='logo'):
    key=f'{prefix}-{x}-{y}-{size}'.replace('.','p')
    return f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="0 0 420 420">'+VECTOR.body(kind,key)+'</svg>'

def word(x,y,color=COLORS['navy'],width=WORD_WIDTH):
    sc=width/(WORD_BOUNDS[2]-WORD_BOUNDS[0]); baseline=y+WORD_BOUNDS[3]*sc
    out=[]
    for gx,path in paths:
        out.append(f'<path d="{path}" transform="translate({x+(gx-WORD_BOUNDS[0])*sc} {baseline}) scale({sc} {-sc})"/>')
    return f'<g fill="{color}">'+''.join(out)+'</g>'

def svg(w,h,body,prefix='logo',background=None,title='Oprino'):
    bg='' if background is None else f'<rect width="{w}" height="{h}" fill="{background}"/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{escape(title)}</title>{defs(prefix)}{bg}{body}</svg>'

def logo(layout='horizontal',variant='full-color',pad=50):
    kind='color' if variant in ['full-color','reversed'] else variant.replace('flat-','')
    color=COLORS['white'] if variant in ['reversed','white'] else ('#000000' if variant=='black' else COLORS['cobalt'] if variant=='flat-blue' else COLORS['navy'])
    if layout=='horizontal':
        w=200+40+WORD_WIDTH+2*pad;h=200+2*pad
        body=icon(pad,pad,200,kind)+word(pad+240,pad+24,color)
    elif layout=='stacked':
        w=WORD_WIDTH+2*pad;h=200+42+152+2*pad
        body=icon((w-200)/2,pad,200,kind)+word(pad,pad+242,color)
    elif layout=='icon':
        w=h=200+2*pad;body=icon(pad,pad,200,kind)
    else:
        w=WORD_WIDTH+2*pad;h=152+2*pad;body=word(pad,pad,color)
    return svg(w,h,body,title=f'Oprino {layout} {variant}'), (w,h)

VARIANTS=[
 ('horizontal','full-color'),('horizontal','reversed'),('horizontal','black'),('horizontal','white'),('horizontal','flat-navy'),('horizontal','flat-blue'),
 ('stacked','full-color'),('stacked','reversed'),('stacked','black'),('stacked','white'),
 ('icon','full-color'),('icon','flat-navy'),('icon','black'),('icon','white'),
 ('wordmark','flat-navy'),('wordmark','white'),
]
SIZES={}

def export(name,content,width,svg_folder,png_folder=None):
    sv=svg_folder/(name+'.svg')
    same=sv.exists() and sv.read_text()==content
    png=png_folder/(name+'.png') if png_folder is not None else None
    if same and png is not None and png.exists():
        try:
            with Image.open(png) as prior:
                if prior.width==width and prior.info.get('dpi',(0,0))[0]>299:return sv
        except OSError:pass
    sv.write_text(content)
    if png_folder is not None:
        raw=cairosvg.svg2png(bytestring=content.encode(),output_width=width*2)
        with Image.open(BytesIO(raw)) as image:
            clean=image.convert('RGBA').resize((width,round(image.height/2)),Image.Resampling.LANCZOS)
            clean.save(png_folder/(name+'.png'),compress_level=7,dpi=(300,300))
    return sv

def text(x,y,value,size=24,color=None,weight=400,family='Manrope',anchor='start'):
    return f'<text x="{x}" y="{y}" font-family="{family}, sans-serif" font-size="{size}" font-weight="{weight}" fill="{color or COLORS["navy"]}" text-anchor="{anchor}">{escape(value)}</text>'

def rounded(x,y,w,h,r=20,fill=None,stroke=None):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill or COLORS["white"]}"'+(f' stroke="{stroke}"' if stroke else '')+'/>'

def embedded_logo(x,y,w,layout='horizontal',variant='full-color',prefix='embedded'):
    content,(ow,oh)=logo(layout,variant)
    inner=content[content.find('</title>')+8:content.rfind('</svg>')]
    inner=inner.replace('logo-',prefix+'-')
    return f'<g transform="translate({x} {y}) scale({w/ow})">{inner}</g>'

def build():
    for layout,variant in VARIANTS:
        name=f'Oprino-{layout}-{variant}';content,dim=logo(layout,variant)
        width=4096
        export(name,content,width,ROOT/'01-Logos/SVG',ROOT/'01-Logos/PNG')
        SIZES[name]={'svg_viewbox':list(dim),'png_width':width}

    for theme,bg in [('light',COLORS['white']),('dark',COLORS['navy'])]:
        body=rounded(0,0,1024,1024,224,bg)+icon(182,182,660,'color')
        content=svg(1024,1024,body,title=f'Oprino app icon {theme}')
        export('Oprino-app-icon-'+theme,content,1024,ROOT/'02-Digital',ROOT/'02-Digital')
        export('Oprino-app-icon-'+theme,content,4096,ROOT/'02-Digital',ROOT/'02-Digital/4K')
    avatar=svg(1024,1024,icon(182,182,660,'color'),background=COLORS['white'],title='Oprino social avatar')
    export('Oprino-social-avatar',avatar,1024,ROOT/'02-Digital',ROOT/'02-Digital')
    export('Oprino-social-avatar',avatar,4096,ROOT/'02-Digital',ROOT/'02-Digital/4K')
    (ROOT/'07-Source/Oprino-icon-vector-master.svg').write_text(VECTOR.svg())

    fav=svg(36,36,icon(3,3,30,'color'),title='Oprino favicon')
    (ROOT/'02-Digital/Favicons/favicon.svg').write_text(fav)
    for size in [16,32,48,64,128,180,192,512]:
        raw=cairosvg.svg2png(bytestring=fav.encode(),output_width=size*4,output_height=size*4)
        image=Image.open(BytesIO(raw)).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
        image.save(ROOT/f'02-Digital/Favicons/favicon-{size}.png',compress_level=7)
    ico=Image.open(ROOT/'02-Digital/Favicons/favicon-128.png')
    ico.save(ROOT/'02-Digital/Favicons/favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
    (ROOT/'02-Digital/Favicons/site.webmanifest').write_text(json.dumps({'name':'Oprino','short_name':'Oprino','icons':[{'src':'favicon-192.png','sizes':'192x192','type':'image/png'},{'src':'favicon-512.png','sizes':'512x512','type':'image/png'}],'theme_color':COLORS['navy'],'background_color':COLORS['white'],'display':'standalone'},indent=2))

    # Editable digital and stationery templates. Placeholder copy is intentional.
    social=rounded(0,0,1080,1080,0,COLORS['navy'])+embedded_logo(45,50,430,variant='reversed',prefix='social')
    social+=text(85,435,'Your next step,',76,COLORS['white'],600,'Space Grotesk')+text(85,535,'clearly.',76,COLORS['white'],600,'Space Grotesk')
    social+=text(85,645,'Replace this message with your campaign copy.',26,'#CBD5E1')
    social+=rounded(85,740,275,75,18,COLORS['cobalt'])+text(222,788,'Primary action',24,COLORS['white'],600,anchor='middle')
    social+='<path d="M820 220 A300 300 0 0 1 1040 540" fill="none" stroke="#24344C" stroke-width="50"/>'
    social+=text(85,1000,'Campaign template / 1080 x 1080',18,'#94A3B8')
    export('Oprino-social-post-template',svg(1080,1080,social,title='Oprino editable social post template'),2160,ROOT/'03-Templates',ROOT/'03-Templates')

    banner=embedded_logo(60,40,430,variant='reversed',prefix='banner')+text(90,290,'Clarity in every direction.',54,COLORS['white'],600,'Space Grotesk')
    banner+=icon(1250,80,240,'color',prefix='logo')
    export('Oprino-social-cover-template',svg(1584,396,banner,background=COLORS['navy']),3168,ROOT/'03-Templates',ROOT/'03-Templates')

    header=embedded_logo(40,20,290,prefix='webhead')+text(1030,89,'Overview',18)+text(1140,89,'About',18)
    header+=rounded(1270,48,225,56,14,COLORS['cobalt'])+text(1382,83,'Primary action',18,COLORS['white'],600,anchor='middle')
    header+=text(100,370,'Your next step,',76,COLORS['navy'],600,'Space Grotesk')+text(100,475,'clearly.',76,COLORS['navy'],600,'Space Grotesk')
    header+=text(100,565,'A clear message. A useful outcome.',26,COLORS['slate'])
    header+=text(100,615,'Replace with your product or service description.',23,COLORS['slate'])
    header+=rounded(100,670,250,68,16,COLORS['cobalt'])+text(225,713,'Primary action',22,COLORS['white'],600,anchor='middle')
    header+=rounded(995,225,470,480,36,COLORS['paper'],COLORS['border'])+icon(1080,285,295,'color')
    header+=text(1230,675,'Example brand application',20,COLORS['slate'],anchor='middle')
    export('Oprino-web-hero-template',svg(1600,900,header,background=COLORS['white']),3200,ROOT/'03-Templates',ROOT/'03-Templates')

    # Card trim: 90 x 55 mm; 3 mm bleed on every edge. Scaled SVG uses 960 x 610 units.
    front=rounded(0,0,960,610,0,COLORS['navy'])+embedded_logo(70,68,610,variant='reversed',prefix='cardfront')
    front+=text(106,393,'Your name',42,COLORS['white'],600,'Space Grotesk')+text(106,443,'Your role',25,'#CBD5E1')
    front+=text(106,520,'name@example.com  |  +91 XXXXX XXXXX',23,'#CBD5E1')
    export('Oprino-business-card-front',svg(960,610,front),1920,ROOT/'03-Templates',ROOT/'03-Templates')
    back=icon(324,139,312,'color')+text(480,525,'Your website address',25,COLORS['slate'],anchor='middle')
    export('Oprino-business-card-back',svg(960,610,back,background=COLORS['white']),1920,ROOT/'03-Templates',ROOT/'03-Templates')

    letter=embedded_logo(45,42,305,prefix='letter')+'<path d="M80 205 H920" stroke="#DDE5EF" stroke-width="2"/>'
    letter+=text(80,285,'Date: [DD Month YYYY]',19,COLORS['slate'])+text(80,380,'Subject / document title',35,COLORS['navy'],600,'Space Grotesk')
    letter+=text(80,450,'Dear [recipient],',23)+text(80,525,'Replace this content with your letter or proposal.',23,COLORS['slate'])
    for yy in [600,640,680,770,810,850,890]:letter+=f'<path d="M80 {yy} H900" stroke="#E5EBF2" stroke-width="3"/>'
    letter+=text(80,1080,'Regards,',22)+text(80,1130,'[Your name / role]',22)
    letter+='<path d="M80 1250 H920" stroke="#DDE5EF" stroke-width="2"/>'+text(80,1310,'[Website]   /   [Email]   /   [Phone]',18,COLORS['slate'])
    export('Oprino-letterhead-template',svg(1000,1414,letter,background=COLORS['white']),2480,ROOT/'03-Templates',ROOT/'03-Templates')

    signature='''<!doctype html><html><meta charset="utf-8"><title>Oprino email signature template</title><body><table role="presentation" cellpadding="0" cellspacing="0" style="font:14px Manrope,Arial,sans-serif;color:#0F172A"><tr><td style="padding:12px 22px 12px 0;border-right:2px solid #20BAAA"><img src="../01-Logos/PNG/Oprino-icon-full-color.png" width="76" height="76" alt="Oprino"></td><td style="padding:12px 0 12px 22px"><strong style="font-size:18px">[Your name]</strong><br><span style="color:#475569">[Your role] | Oprino</span><br><br><a href="mailto:name@example.com" style="color:#164CFF;text-decoration:none">[Email]</a> &nbsp;|&nbsp; [Phone]<br><a href="https://example.com" style="color:#164CFF;text-decoration:none">[Website]</a></td></tr></table><p style="font:12px Manrope,Arial,sans-serif;color:#475569">Replace all bracketed fields and host the icon at an HTTPS URL before copying into your email client.</p></body></html>'''
    (ROOT/'03-Templates/Oprino-email-signature.html').write_text(signature)

    tokens={'brand':'Oprino','version':'1.3','icon_source':'Clean vector trace derived from the user-supplied pin/check raster; original reference retained','colors':COLORS,'fonts':{'heading':'Space Grotesk','body':'Manrope','wordmark':'Unbounded Medium 500 outlined; -0.012 em optical tracking'},'type_scale_px':{'display':48,'h2':36,'h3':26,'body':16,'small':14,'caption':12},'spacing_px':[4,8,16,24,32,48,64,96],'radii_px':{'small':8,'medium':16,'large':24},'logo_rules':{'clear_space':'0.25 x icon height on each side','horizontal_min_px':160,'stacked_min_px':96,'icon_min_px':24},'logo_exports':SIZES}
    (ROOT/'05-Design-Tokens/Oprino-tokens.json').write_text(json.dumps(tokens,indent=2))
    css='''@font-face { font-family: 'Unbounded'; src: url('../06-Fonts/Unbounded-Medium.ttf') format('truetype'); font-style: normal; font-weight: 500; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('../06-Fonts/SpaceGrotesk-Regular.ttf') format('truetype'); font-style: normal; font-weight: 400; font-display: swap; }
@font-face { font-family: 'Space Grotesk'; src: url('../06-Fonts/SpaceGrotesk-SemiBold.ttf') format('truetype'); font-style: normal; font-weight: 600; font-display: swap; }
@font-face { font-family: Manrope; src: url('../06-Fonts/Manrope-Variable.ttf') format('truetype'); font-style: normal; font-weight: 200 800; font-display: swap; }
:root {
  --oprino-navy: #0F172A;
  --oprino-cobalt: #164CFF;
  --oprino-ocean: #087DE5;
  --oprino-mint: #20BAAA;
  --oprino-slate: #475569;
  --oprino-paper: #F8FAFC;
  --oprino-border: #DDE5EF;
  --oprino-white: #FFFFFF;
  --oprino-font-wordmark: 'Unbounded', sans-serif;
  --oprino-font-heading: 'Space Grotesk', sans-serif;
  --oprino-font-body: 'Manrope', sans-serif;
  --oprino-h1: clamp(2rem, 1.4rem + 2.6vw, 3rem);
  --oprino-h2: clamp(1.625rem, 1.25rem + 1.7vw, 2.25rem);
  --oprino-h3: clamp(1.25rem, 1.05rem + 0.9vw, 1.625rem);
  --oprino-body: clamp(1rem, 0.95rem + 0.2vw, 1.125rem);
  --oprino-radius: 1rem;
  --oprino-space-1: 0.5rem;
  --oprino-space-2: 1rem;
  --oprino-space-3: 1.5rem;
  --oprino-space-4: 2rem;
  --oprino-space-6: 3rem;
  --oprino-space-8: 4rem;
  --oprino-space-12: 6rem;
}
/* Mint is a decorative accent; use navy or cobalt for normal text on white. */
'''
    (ROOT/'05-Design-Tokens/Oprino-tokens.css').write_text(css)
    palette='GIMP Palette\nName: Oprino\nColumns: 4\n#\n'
    for name,hx in COLORS.items():palette+=' '.join(str(int(hx[i:i+2],16)) for i in (1,3,5))+' '+name+'\n'
    (ROOT/'05-Design-Tokens/Oprino-palette.gpl').write_text(palette)
    for p in FONTS.iterdir():
        if p.name in ['SpaceGrotesk-SemiBold.ttf','SpaceGrotesk-Regular.ttf','Manrope-Variable.ttf','SpaceGrotesk-OFL.txt','Manrope-OFL.txt','SpaceGrotesk-Variable.ttf','Manrope-Regular.ttf','Manrope-SemiBold.ttf','Unbounded-Medium.ttf','Unbounded-Variable.ttf','Unbounded-OFL.txt']:
            if p.resolve() != (ROOT/'06-Fonts'/p.name).resolve():shutil.copyfile(p,ROOT/'06-Fonts'/p.name)

    # Brand board composed from the same supplied icon and outlined wordmark.
    board=rounded(0,0,1800,2060,0,COLORS['paper'])+text(85,100,'OPRINO / IDENTITY SYSTEM',25,COLORS['slate'],600)
    board+=rounded(80,155,1640,520,28,COLORS['white'])+embedded_logo(230,245,1340,prefix='board-master')
    board+=text(125,625,'01  PRIMARY LOGO',20,COLORS['slate'],600)
    for i,(v,bg) in enumerate([('reversed',COLORS['navy']),('black',COLORS['white']),('white',COLORS['navy'])]):
        xx=80+i*560;board+=rounded(xx,705,520,240,24,bg)+embedded_logo(xx+28,755,464,variant=v,prefix=f'board-{i}')
    board+=text(85,1010,'02  BRAND COLORS',21,COLORS['slate'],600)
    for i,n in enumerate(['navy','cobalt','ocean','mint','slate','paper']):
        xx=80+i*280;board+=rounded(xx,1045,240,155,18,COLORS[n],COLORS['border'] if n=='paper' else None)
        board+=text(xx,1240,n.upper(),20,COLORS['navy'],600)+text(xx,1274,COLORS[n],21,COLORS['slate'])
    board+=rounded(80,1330,820,285,24,COLORS['white'])+text(120,1390,'03  TYPOGRAPHY',20,COLORS['slate'],600)
    board+=text(120,1450,'Unbounded',34,COLORS['navy'],500,'Unbounded')+text(860,1450,'Logo / 500',20,COLORS['slate'],anchor='end')
    board+=text(120,1510,'Space Grotesk',32,COLORS['navy'],600,'Space Grotesk')+text(860,1510,'Headings / 600',20,COLORS['slate'],anchor='end')
    board+=text(120,1570,'Manrope',30,COLORS['navy'],400,'Manrope')+text(860,1570,'Body / 400',20,COLORS['slate'],anchor='end')
    board+=rounded(930,1330,790,285,24,COLORS['navy'])+icon(980,1400,145,'color')+word(1175,1420,COLORS['white'],width=475)+text(1175,1562,'App and social identity',23,'#CBD5E1')
    board+=rounded(80,1650,1640,305,24,COLORS['white'])+embedded_logo(110,1680,360,prefix='board-web')
    board+=text(1530,1765,'Primary action',20,COLORS['cobalt'],600,anchor='end')+text(140,1850,'Clarity. Confidence. Progress.',46,COLORS['navy'],600,'Space Grotesk')
    board+=text(140,1905,'Consistent logos, thoughtful color and practical typography.',23,COLORS['slate'])
    board+=text(85,2020,'Version 1.3 / 04 October 2026 / Clean vector icon + outlined wordmark',19,COLORS['slate'])
    content=svg(1800,2060,board,title='Oprino full brand identity board')
    export('Oprino-Brand-Board',content,3600,ROOT/'04-Guidelines',ROOT/'04-Guidelines')
    shutil.copyfile(ROOT/'04-Guidelines/Oprino-Brand-Board.png',BASE/'Oprino-Brand-Board.png')
    (WORK/'asset_manifest.json').write_text(json.dumps({'variants':VARIANTS,'sizes':SIZES,'root':str(ROOT)},indent=2))
    print(json.dumps({'logo_variants':len(VARIANTS),'files':sum(1 for p in ROOT.rglob('*') if p.is_file()),'root':str(ROOT)}))

if __name__=='__main__':build()
