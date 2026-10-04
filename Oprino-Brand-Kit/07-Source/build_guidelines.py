from pathlib import Path
import sys, json, math, shutil, zipfile
from io import BytesIO
from collections import defaultdict
import build_assets as A
sys.path.insert(0, str(A.WORK/'dependencies'))
import cairosvg, fitz
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont as RLFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT=A.ROOT;BASE=A.BASE;WORK=A.WORK;C=A.COLORS
GUIDE=BASE/'Oprino-Brand-Guidelines.pdf'
W,H=841.89,595.28;M=48;CW=W-2*M
for nm,file in [('Space','SpaceGrotesk-Regular.ttf'),('SpaceSB','SpaceGrotesk-SemiBold.ttf')]:
    pdfmetrics.registerFont(RLFont(nm,str(A.FONTS/file)))
for weight,nm in [(400,'Manrope'),(600,'ManropeSB')]:
    path=WORK/f'{nm}.ttf'
    if not path.exists():
        f=TTFont(str(A.FONTS/'Manrope-Variable.ttf'))
        instance=instantiateVariableFont(f,{'wght':weight},inplace=False)
        instance.save(path)
    pdfmetrics.registerFont(RLFont(nm,str(path)))

PDF=canvas.Canvas(str(WORK/'guideline-base.pdf'),pagesize=(W,H))
PDF.setTitle('Oprino Brand Guidelines | Version 1.3')
PDF.setAuthor('Oprino')
PDF.setSubject('Logo identity, color, typography, applications and brand usage rules')
PAGE=-1;OVERLAYS=defaultdict(list);OUTLINE=[]

def txt(x,y,s,size=12,font='Manrope',color=None,align='left'):
    PDF.setFillColor(HexColor(color or C['navy']));PDF.setFont(font,size)
    fn=PDF.drawString if align=='left' else PDF.drawRightString if align=='right' else PDF.drawCentredString
    fn(x,H-y-size*.84,str(s))

def wrap(s,width,size=11,font='Manrope'):
    lines=[]
    for para in str(s).split('\n'):
        line=''
        for word in para.split():
            test=(line+' '+word).strip()
            if line and pdfmetrics.stringWidth(test,font,size)>width:
                lines.append(line);line=word
            else:line=test
        lines.append(line)
    return lines

def para(x,y,s,width,size=11,font='Manrope',color=None,leading=None):
    leading=leading or size*1.5
    for line in wrap(s,width,size,font):
        txt(x,y,line,size,font,color);y+=leading
    return y

def box(x,y,w,h,fill=None,r=14,stroke=None):
    PDF.setFillColor(HexColor(fill or C['paper']))
    PDF.setStrokeColor(HexColor(stroke or fill or C['paper']))
    PDF.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))

def line(x1,y1,x2,y2,color=None,width=1,dash=None):
    PDF.setStrokeColor(HexColor(color or C['border']));PDF.setLineWidth(width)
    PDF.setDash(dash or [])
    PDF.line(x1,H-y1,x2,H-y2);PDF.setDash([])

def logo(x,y,w=None,h=None,layout='horizontal',variant='full-color',source=None):
    file=source or ROOT/f'01-Logos/SVG/Oprino-{layout}-{variant}.svg'
    if source is None:
        _,dim=A.logo(layout,variant)
    else:dim=(1600,900)
    if w is None:w=h*dim[0]/dim[1]
    if h is None:h=w*dim[1]/dim[0]
    OVERLAYS[PAGE].append({'file':str(file),'rect':(x,y,x+w,y+h)})
    return (w,h)

def label(x,y,s,color=None):txt(x,y,s.upper(),8.5,'ManropeSB',color or C['slate'])

def page(section,title,subtitle='',dark=False):
    global PAGE
    if PAGE>=0:PDF.showPage()
    PAGE+=1;OUTLINE.append((section,title))
    bg=C['navy'] if dark else C['white'];fg=C['white'] if dark else C['navy']
    box(0,0,W,H,bg,0)
    label(M,29,'Oprino / brand guidelines', '#94A3B8' if dark else C['slate'])
    txt(W-M,29,section.upper(),8.5,'ManropeSB','#94A3B8' if dark else C['slate'],align='right')
    txt(M,76,title,31,'SpaceSB',fg)
    if subtitle:para(M,129,subtitle,CW,10.5,color='#CBD5E1' if dark else C['slate'],leading=15)
    line(M,H-43,W-M,H-43,'#24344C' if dark else C['border'])
    txt(M,H-29,'VERSION 1.3 / 04 OCTOBER 2026',8,'Manrope','#94A3B8' if dark else C['slate'])
    txt(W-M,H-29,f'{PAGE+1:02d}',8,'Manrope','#94A3B8' if dark else C['slate'],align='right')

def callout(x,y,w,title,body,fill=None,height=104):
    box(x,y,w,height,fill or C['paper'])
    txt(x+18,y+18,title,15,'SpaceSB')
    para(x+18,y+47,body,w-36,10.5,color=C['slate'],leading=15)

def table(x,y,widths,head,rows,rowh=42):
    xx=x
    for width,h in zip(widths,head):
        box(xx,y,width,32,C['navy'],0);txt(xx+12,y+10,h,9,'ManropeSB',C['white']);xx+=width
    yy=y+32
    for i,row in enumerate(rows):
        xx=x
        for width,val in zip(widths,row):
            box(xx,yy,width,rowh,C['paper'] if i%2==0 else C['white'],0)
            para(xx+12,yy+10,val,width-24,9.5,leading=13.5)
            xx+=width
        yy+=rowh
    return yy

def luminance(hx):
    rgb=[int(hx[i:i+2],16)/255 for i in (1,3,5)]
    lin=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return .2126*lin[0]+.7152*lin[1]+.0722*lin[2]

def contrast(a,b):
    aa,bb=sorted([luminance(a),luminance(b)],reverse=True)
    return (aa+.05)/(bb+.05)

def cmyk(hx):
    r,g,b=[int(hx[i:i+2],16)/255 for i in (1,3,5)];k=1-max(r,g,b)
    if k==1:return (0,0,0,100)
    return tuple(round(v*100) for v in ((1-r-k)/(1-k),(1-g-k)/(1-k),(1-b-k)/(1-k),k))

# 01 / Cover
page('01 / Identity','A clear direction.',dark=True)
logo(91,173,660,variant='reversed')
txt(M,449,'Oprino brand guidelines',21,'SpaceSB',C['white'])
para(M,485,'The complete visual system: logos, colors, typography, practical rules and ready-to-use applications.',600,11,color='#CBD5E1')

# 02 / Foundations + contents
page('02 / Foundations','Clarity. Confidence. Progress.','The visual direction for Oprino, built around the approved location-pin and forward-check symbol.')
items=[('Clarity','A clear focal point, generous space and practical language.'),('Confidence','A stable navy wordmark and restrained, consistent layouts.'),('Progress','Blue gives direction. The green check suggests a completed step.')]
for i,(title,body) in enumerate(items):callout(M+i*253,187,239,title,body)
label(M,328,'Inside this guide')
contents=[('03-07','Logo system and usage'),('08-09','Color and contrast'),('10-12','Type, graphics and voice'),('13-15','Applications and protection'),('16-17','Handoff and Canva setup')]
for i,(n,t) in enumerate(contents):txt(M,363+i*27,n,10,'ManropeSB',C['cobalt']);txt(M+70,363+i*27,t,10.5)
para(444,340,'This is a visual identity system. Industry, mission, audience, legal company name and contact details have not been supplied. Application copy is illustrative and is not an adopted tagline.',344,10.5,color=C['slate'])

# 03 / The primary logo
page('03 / Master logo','The same mark. Clean at every size.','Use the clean vector master derived from the supplied pin/check. Keep the icon proportions and wordmark together.')
box(M,184,CW,240,C['paper']);logo(108,190,625)
callout(M,438,239,'The symbol','Your supplied blue-green pin/check silhouette, faithfully traced into scalable paths.')
callout(M+253,438,239,'The wordmark','Unbounded Medium 500 with tighter optical spacing; supplied as outlines.')
callout(M+506,438,239,'The export','Fully vector SVG/PDF artwork, with smooth icon paths and an outlined wordmark.')

# 04 / Lockups
page('04 / Lockups','Choose the right format.','The horizontal lockup is the default. Use the stacked version when width is limited, and the icon for compact spaces.')
cards=[('horizontal', 'Primary / horizontal', 'Headers, proposals, email and general branding.'),('stacked','Secondary / stacked','Centered covers and narrow placements.'),('icon','Symbol / icon only','App icons, avatars and favicons.')]
for i,(layout,title,body) in enumerate(cards):
    xx=M+i*253;box(xx,185,239,275,C['paper'])
    if layout=='horizontal':logo(xx+12,242,215,layout=layout)
    elif layout=='stacked':logo(xx+40,198,160,layout=layout)
    else:logo(xx+56,216,127,layout=layout)
    txt(xx+18,367,title,13,'SpaceSB');para(xx+18,399,body,203,10.5,color=C['slate'])
para(M,487,'Wordmark-only files are supporting assets. Use them where the icon already appears nearby or where a compact word label is needed.',CW,10.5,color=C['slate'])

# 05 / Variations
page('05 / Color variations','A version for every surface.','Choose a supplied variant instead of recoloring individual parts of the logo.')
samples=[('full-color',C['white'],'Full color / light surfaces'),('reversed',C['navy'],'Full color / navy surfaces'),('black',C['white'],'Black / one-color production'),('white',C['navy'],'White / dark one-color use'),('flat-navy',C['white'],'Flat navy / restrained layouts'),('flat-blue',C['white'],'Flat cobalt / single-brand color')]
for i,(variant,bg,title) in enumerate(samples):
    xx=M+(i%3)*253;yy=185+(i//3)*167
    box(xx,yy,239,128,bg,14,C['border'] if bg==C['white'] else None);logo(xx+9,yy+22,221,variant=variant)
    txt(xx,yy+141,title,9.5,'ManropeSB')
para(M,523,'Full color keeps the original white pin on a circular white base. One-color variants use transparent negative space.',CW,9.5,color=C['slate'])

# 06 / Clear space
page('06 / Clear space','Give the logo room to breathe.','Let x equal one quarter of the icon height. Keep at least x clear on every side of the complete lockup.')
lx,ly,lw=105,211,632
_,(ow,oh)=A.logo();lh=lw*oh/ow;s=lw/ow;pad=50*s
logo(lx,ly,lw)
for xx,yy,ww,hh,col,ds in [(lx,ly,lw,lh,C['cobalt'],[4,3]),(lx+pad,ly+pad,lw-2*pad,lh-2*pad,C['border'],[2,3])]:
    line(xx,yy,xx+ww,yy,col,1,ds);line(xx,yy+hh,xx+ww,yy+hh,col,1,ds);line(xx,yy,xx,yy+hh,col,1,ds);line(xx+ww,yy,xx+ww,yy+hh,col,1,ds)
txt(lx+pad*.5,ly+pad*.25,'x',12,'ManropeSB',C['cobalt']);txt(lx+lw-pad*.5,ly+lh*.5,'x',12,'ManropeSB',C['cobalt'],align='center')
callout(M,461,360,'Clear space is required','Keep text, crop edges, photos and other logos outside the dashed area.',height=88)
callout(M+380,461,365,'Padding is included','The supplied master exports already include the minimum outer padding.',height=88)

# 07 / Minimum size
page('07 / Minimum size','Readable at the size you use.','These starting sizes include the supplied export padding. Inspect the final output at its actual viewing size.')
table(M,187,[180,146,146,273],['Format','Digital width','Print width','Use'],[
 ['Horizontal','160 px or larger','30 mm or larger','Default logo for most communications'],
 ['Stacked','96 px or larger','22 mm or larger','Centered, compact compositions'],
 ['Icon','24 px or larger','6 mm or larger','Compact identity marker'],
 ['Wordmark only','120 px or larger','24 mm or larger','Support when the icon is nearby'],
],44)
label(M,441,'Actual digital-size examples')
logo(M-10,462,160);logo(285,459,96,layout='stacked');logo(451,479,24,layout='icon')
para(520,454,'Favicon exports include 16, 32, 48 and 64 px versions. This is a browser-only small-size exception; use the larger icon elsewhere.',273,10,color=C['slate'])

# 08 / Palette
page('08 / Color palette','Blue gives direction. Green signals progress.','Navy and neutral surfaces lead. Cobalt is the primary action color; mint is a supporting accent.')
names=['navy','cobalt','ocean','mint','slate','paper']
for i,name in enumerate(names):
    xx=M+(i%3)*253;yy=184+(i//3)*153;hx=C[name]
    box(xx,yy,239,70,hx,12,C['border'] if name=='paper' else None)
    txt(xx,yy+80,name.upper(),10,'ManropeSB');txt(xx+239,yy+80,hx,10,'Manrope',align='right')
    rgb=', '.join(str(int(hx[j:j+2],16)) for j in (1,3,5))
    txt(xx,yy+102,'RGB  '+rgb,9,'Manrope',C['slate'])
    txt(xx,yy+118,'CMYK*  '+', '.join(map(str,cmyk(hx))),9,'Manrope',C['slate'])
para(M,503,'White: #FFFFFF / RGB 255, 255, 255. Logo depth: #1235A4. Logo blue gradient: #164CFF to #087DE5. Mint gradient: #20BAAA to #10AFA0.',CW,9.5,color=C['slate'],leading=13)
txt(M,535,'*CMYK values are approximate conversions. Use a printer color proof for final production.',8.5,'Manrope',C['slate'])

# 09 / Contrast
page('09 / Contrast','Color that stays readable.','Use measured text pairs for communication and UI. Mint works as a highlight, with navy text on top.')
pairs=[('Navy on white','navy','white'),('Cobalt on white','cobalt','white'),('White on cobalt','white','cobalt'),('Slate on white','slate','white'),('Navy on mint','navy','mint'),('Mint on white','mint','white')]
for i,(title,fg,bg) in enumerate(pairs):
    xx=M+(i%3)*253;yy=186+(i//3)*146;r=contrast(C[fg],C[bg]);passed=r>=4.5
    box(xx,yy,239,88,C[bg],12,C['border'] if bg=='white' else None)
    txt(xx+18,yy+24,'Readable example',17,'SpaceSB',C[fg])
    txt(xx+18,yy+58,f'{r:.2f}:1',11,'ManropeSB',C[fg])
    txt(xx,yy+99,title,10,'ManropeSB');txt(xx,yy+119,'Normal text: '+('meets 4.5:1' if passed else 'do not use'),9,'Manrope',C['slate'])
para(M,502,'WCAG 2.2 normal text uses a 4.5:1 minimum; large text uses 3:1. Ratios above are calculated from the listed solid HEX fills. Logos have a separate exception, but interface text still needs its own check.',CW,9.5,color=C['slate'],leading=14)

# 10 / Typography
page('10 / Typography','A distinctive wordmark. A readable system.','Unbounded for the logo. Space Grotesk for headings. Manrope for body, labels and everyday interfaces.')
for i in range(3):box(M+i*253,186,239,278,C['navy'] if i==2 else C['paper'])
txt(M+18,207,'UNBOUNDED',10,'ManropeSB',C['slate']);logo(M+5,249,229,layout='wordmark',variant='flat-navy')
para(M+18,344,'Logo only / Medium 500\nTighter optical spacing: -0.012 em.\nUse the supplied outlined artwork.',203,10.5,color=C['slate'],leading=22)
txt(M+271,207,'SPACE GROTESK',10,'ManropeSB',C['slate']);txt(M+271,250,'Aa Bb Cc',30,'SpaceSB')
para(M+271,315,'Headings / SemiBold 600\nSentence case and clear hierarchy.\nUse for short headlines and titles.',203,10.5,color=C['slate'],leading=22)
txt(M+524,207,'MANROPE',10,'ManropeSB','#94A3B8');txt(M+524,253,'Clear, useful.',24,'ManropeSB',C['white'])
para(M+524,315,'Body / 400; controls / 600\nReadable text and useful labels.\nUse a 1.5-1.6 body line height.',203,10.5,color='#CBD5E1',leading=22)
rows=[('Display / H1','48 px / 3 rem','Space Grotesk 600'),('H2','36 px / 2.25 rem','Space Grotesk 600'),('H3','26 px / 1.625 rem','Space Grotesk 600'),('Body','16 px / 1 rem','Manrope 400'),('Small','14 px / .875 rem','Manrope 400')]
for i,(name,sz,face) in enumerate(rows):
    xx=M+i*151;txt(xx,486,name,8.5,'ManropeSB');txt(xx,506,sz,8.5,'Manrope');txt(xx,524,face,8.5,'Manrope',C['slate'])

# 11 / Graphic system
page('11 / Graphic language','Simple geometry. Intentional space.','Use circular arcs, gentle route lines and clean cards. Keep the logo symbol distinctive and uncluttered.')
box(M,186,350,245,C['navy'])
PDF.setStrokeColor(HexColor('#2C3E58'));PDF.setLineWidth(26);PDF.arc(M+37,H-391,M+285,H-222,startAng=15,extent=125)
PDF.setStrokeColor(HexColor(C['mint']));PDF.setLineWidth(2)
pp=PDF.beginPath();pp.moveTo(M+40,H-385);pp.curveTo(M+130,H-385,M+160,H-248,M+286,H-248);PDF.drawPath(pp)
for xx,yy in [(M+40,385),(M+286,248)]:box(xx-5,yy-5,10,10,C['mint'],5)
txt(M+22,456,'Arcs and route accents',14,'SpaceSB');para(M+22,485,'Use low-contrast decorative geometry away from text and controls.',303,10.5,color=C['slate'])
label(438,193,'Layout tokens')
table(438,221,[138,216],['Token','Default'],[['Spacing','8 / 16 / 24 / 32 / 48 / 64 px'],['Corners','8 / 16 / 24 px'],['UI icons','2 px stroke / rounded ends'],['Surface','White or #F8FAFC'],['Border','#DDE5EF / 1 px']],37)
para(438,464,'Use an 8 px base grid. A 4 px adjustment is available for optical alignment. Keep one primary action per small composition.',350,10.5,color=C['slate'])

# 12 / Voice
page('12 / Brand voice','Say it clearly. Make it useful.','A practical writing direction for Oprino communications; adapt product details when the business brief is available.')
table(M,187,[164,293,288],['Principle','Use','Avoid'],[
 ['Clear','Your update is ready.','Your data has been synergistically activated.'],
 ['Confident','See the next step.','Probably the best solution ever.'],
 ['Useful','Choose a location to continue.','An error occurred.'],
 ['Respectful','Check the details and try again.','You entered the wrong information.'],
 ['Concise','Start your next step.','Unlock a limitless new digital ecosystem.'],
],48)
para(M,499,'Naming: use Oprino in written sentences and titles; retain oprino in the logo artwork. Sample campaign lines in this kit are placeholders, not approved brand taglines.',CW,10.5,color=C['slate'])

# 13 / Digital applications
page('13 / Digital','A recognizable digital presence.','Use the same symbol for app and social identity. Keep the full lockup for headers and larger placements.')
box(M,187,501,286,C['paper']);logo(M+16,199,188)
txt(M+30,302,'Your next step,',26,'SpaceSB');txt(M+30,340,'clearly.',26,'SpaceSB');para(M+30,383,'A product or service message\nbelongs here.',230,10.5,color=C['slate'])
box(M+31,431,135,32,C['cobalt'],8);txt(M+48,440,'Primary action',10,'ManropeSB',C['white'])
box(585,187,208,286,C['navy'],23);box(593,197,192,266,C['paper'],17);logo(621,226,136,layout='icon');txt(689,380,'Oprino',17,'SpaceSB',align='center');txt(689,415,'Example app screen',9,'Manrope',C['slate'],align='center')
para(M,497,'Included: light and dark app icons, social avatar, square social post, cover banner, web hero and browser favicon set.',CW,10.5,color=C['slate'])

# 14 / Stationery
page('14 / Stationery','Professional, with room for the message.','Editable layouts are included for a business card, letterhead and email signature.')
box(M,187,370,235,C['paper']);logo(M+10,201,214)
txt(M+28,311,'Your name',20,'SpaceSB');txt(M+28,346,'Your role',10,'Manrope',C['slate']);txt(M+28,376,'name@example.com  |  +91 XXXXX XXXXX',9,'Manrope',C['slate'])
box(446,187,347,304,C['paper']);box(472,203,296,266,C['white'],0,C['border']);logo(485,211,132)
line(496,271,742,271);txt(496,295,'Subject / document title',12,'SpaceSB')
for yy in [331,349,367,402,420]:line(496,yy,742,yy,C['border'],1)
txt(496,449,'[Website] / [Email] / [Phone]',7,'Manrope',C['slate'])
para(M,442,'Card trim: 90 x 55 mm.\nBleed: 3 mm on all sides.\nLetterhead: A4 portrait, 210 x 297 mm.',370,10.5,color=C['slate'],leading=22)
para(M,520,'Replace all placeholders before production. Stationery PDFs are RGB layouts with trim/bleed geometry; proof final color with the printer.',CW,9.5,color=C['slate'])

# 15 / Logo protection
page('15 / Protection','Protect the shape, spacing and color.','Always start with a supplied master. Export a suitable size rather than rebuilding the logo by eye.')
rules=[('Do not stretch','Keep the original aspect ratio when resizing.'),('Do not rotate','Keep the lockup upright and horizontally aligned.'),('Do not recolor parts','Choose the full-color or supplied one-color variants.'),('Do not add effects','Avoid extra shadows, outlines, glow or bevel effects.'),('Do not crowd the logo','Keep the minimum x clear space free of other content.'),('Do not use busy surfaces','Place a quiet light or dark panel behind the logo.')]
for i,(title,body) in enumerate(rules):
    xx=M+(i%2)*381;yy=188+(i//2)*111
    box(xx,yy,364,94,C['paper']);txt(xx+17,yy+16,title,14,'SpaceSB');para(xx+17,yy+44,body,331,10.5,color=C['slate'],leading=15)

# 16 / Handoff
page('16 / Asset guide','Use the file made for the job.','The package is organized so designers, developers and printers can find the right asset quickly.')
table(M,185,[181,133,431],['Folder','Format','What it contains'],[
 ['01-Logos','SVG / PNG / PDF','16 vector variants + 4096 px PNG masters'],
 ['02-Digital','SVG / PNG / ICO','1024 px + 4K app/avatar, favicons, web manifest'],
 ['03-Templates','SVG / PNG / PDF / HTML','Social post, cover, web hero, business card, A4 letterhead, email signature'],
 ['04-Guidelines','PDF / SVG / PNG / MD','This guideline, brand board and editable written rules'],
 ['05-Design-Tokens','JSON / CSS / GPL','Color, type and spacing tokens; responsive clamp typography'],
 ['06-Fonts','TTF / TXT','Unbounded, Space Grotesk and Manrope with OFL licenses'],
],42)
para(M,496,'SVG/PDF: resolution-independent vector artwork. PNG: 4096 px logo masters with clean transparency. Templates: retina exports. Use SVG/PDF for large placements and print; export PNG at the size you need.',CW,10,color=C['slate'],leading=14)

# 17 / Canva setup + source register
page('17 / Canva + sources','A practical Canva setup.','The package and imported designs provide a usable handoff for Canva. Brand Hub configuration can use the same supplied values.')
steps=[('01','Upload logos','Use 01-Logos/PNG for 4K placements and 01-Logos/SVG or PDF for sharp scalable artwork.'),('02','Set colors','Navy #0F172A, cobalt #164CFF, ocean #087DE5, mint #20BAAA, slate #475569, paper #F8FAFC and white.'),('03','Set typography','Logo: Unbounded Medium 500. Heading: Space Grotesk 600. Body: Manrope Regular 400.'),('04','Start from templates','Use supplied social and stationery templates. Replace all placeholder copy and contact details.')]
for i,(n,title,body) in enumerate(steps):
    yy=190+i*65;txt(M,yy,n,15,'SpaceSB',C['cobalt']);txt(M+42,yy,title,12,'SpaceSB');para(M+42,yy+22,body,CW-42,9.5,color=C['slate'],leading=13.5)
label(M,461,'Reference register')
refs=[('Unbounded / logo type','https://fonts.google.com/specimen/Unbounded'),('Space Grotesk / Google Fonts','https://fonts.google.com/specimen/Space+Grotesk'),('Manrope / Google Fonts','https://fonts.google.com/specimen/Manrope'),('WCAG 2.2 / contrast minimum','https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html')]
for i,(name,url) in enumerate(refs):
    yy=481+i*15;txt(M,yy,name,8.3,'ManropeSB');txt(M+195,yy,url,8.3,'Manrope',C['cobalt']);PDF.linkURL(url,(M+195,H-yy-12,W-M,H-yy+3),relative=0)
PDF.save()

# Place the clean vector icon and outlined wordmark over the layout PDF.
source_cache={}
doc=fitz.open(WORK/'guideline-base.pdf')
for idx,overlays in OVERLAYS.items():
    for item in overlays:
        filename=item['file']
        if filename not in source_cache:
            data=cairosvg.svg2pdf(url=filename)
            source_cache[filename]=fitz.open(stream=data,filetype='pdf')
        doc[idx].show_pdf_page(fitz.Rect(item['rect']),source_cache[filename],0,keep_proportion=True)
doc.save(GUIDE,garbage=4,deflate=True)
shutil.copyfile(GUIDE,ROOT/'04-Guidelines/Oprino-Brand-Guidelines.pdf')

# A vector logo variation document using the traced supplied icon for Canva handoff.
sheet=fitz.open()
for layout,variant in A.VARIANTS:
    pg=sheet.new_page(width=W,height=H)
    bg=C['navy'] if variant in ['white','reversed'] else C['white']
    rgb=tuple(int(bg[i:i+2],16)/255 for i in (1,3,5));pg.draw_rect(pg.rect,color=None,fill=rgb)
    path=ROOT/f'01-Logos/SVG/Oprino-{layout}-{variant}.svg'
    inp=fitz.open(stream=cairosvg.svg2pdf(url=str(path)),filetype='pdf')
    pg.show_pdf_page(fitz.Rect(65,80,W-65,H-80),inp,0,keep_proportion=True)
# Individual vector masters for print and scalable placements.
for layout,variant in A.VARIANTS:
    path=ROOT/f"01-Logos/SVG/Oprino-{layout}-{variant}.svg"
    (ROOT/f"01-Logos/PDF/Oprino-{layout}-{variant}.pdf").write_bytes(cairosvg.svg2pdf(url=str(path)))

sheet.set_metadata({'title':'Oprino | 16 logo variations','author':'Oprino'})
sheet_path=ROOT/'01-Logos/Oprino-Logo-Variations.pdf';sheet.save(sheet_path,garbage=4,deflate=True)
shutil.copyfile(sheet_path,BASE/'Oprino-Logo-Variations.pdf')

# Keep Canva's PDF importer from changing paragraph spacing or substituting type.
# This extra import file lives in the working folder; the handoff PDF stays readable.
canva_source=fitz.open(GUIDE)
canva_document=fitz.open()
for source_page in canva_source:
    outlined_svg=source_page.get_svg_image(text_as_path=True)
    outlined_page=fitz.open(stream=cairosvg.svg2pdf(bytestring=outlined_svg.encode()),filetype='pdf')
    output_page=canva_document.new_page(width=source_page.rect.width,height=source_page.rect.height)
    output_page.show_pdf_page(output_page.rect,outlined_page,0)
canva_document.set_metadata(canva_source.metadata)
canva_document.save(WORK/'Oprino-Brand-Guidelines-Canva.pdf',garbage=4,deflate=True)

def physical_pdf(files,path,width_mm,height_mm,trim_mm=0):
    mm=72/25.4;out=fitz.open()
    for file in files:
        p=out.new_page(width=width_mm*mm,height=height_mm*mm)
        src=fitz.open(stream=cairosvg.svg2pdf(url=str(file)),filetype='pdf')
        p.show_pdf_page(p.rect,src,0)
        if trim_mm:p.set_trimbox(fitz.Rect(trim_mm*mm,trim_mm*mm,(width_mm-trim_mm)*mm,(height_mm-trim_mm)*mm))
    out.set_metadata({'title':Path(path).stem,'author':'Oprino'})
    out.save(path,garbage=4,deflate=True)

physical_pdf([ROOT/'03-Templates/Oprino-business-card-front.svg',ROOT/'03-Templates/Oprino-business-card-back.svg'],ROOT/'03-Templates/Oprino-Business-Card-Print.pdf',96,61,3)
physical_pdf([ROOT/'03-Templates/Oprino-letterhead-template.svg'],ROOT/'03-Templates/Oprino-Letterhead-A4.pdf',210,297)

# Editable written source / quick-start notes.
md=f'''# Oprino brand guidelines

Version 1.3 - 04 October 2026

## Identity
Oprino uses a clean vector trace of the user-supplied blue-green location-pin/check, with a lowercase oprino wordmark. The pin, check, proportions and blue-green identity are preserved while the raster edges are replaced with smooth scalable paths. This is a vector rendition derived from the reference, rather than an original supplied vector file. The original screenshot and unmodified crop remain in 07-Source/original-icon. The wordmark uses Unbounded Medium 500 with -0.012 em optical tracking, supplied as outlines. Logo SVG/PDF files contain vector paths and gradients without embedded raster images.

Design principles: clarity, confidence and progress. Industry, audience, mission, legal company name, website and contact details have not been supplied. Copy in application templates is illustrative and is not an adopted tagline.

## Logo formats
Default: horizontal. Secondary: stacked. Compact: icon only. Wordmark-only assets support placements where the icon is already nearby.

There are 16 variants in SVG, individual vector PDF and transparent PNG. Every logo PNG master is 4096 px wide, rendered from the vector source with antialiased edges and lossless compression. App icons and avatars include standard 1024 px and 4096 px exports. Favicons are rendered at each native size.

Full color: the clean blue-green vector icon with its white pin and gap retained, plus a navy wordmark. Reversed: full-color symbol and white wordmark. One-color: black, white, navy and cobalt, with transparent negative space. The dark blue depth in the full-color symbol is part of the master, not an extra shadow effect.

## Clear space and minimum size
Clear space x = 0.25 times the icon height on each side of the complete lockup. Master exports include this padding.

| Format | Minimum digital export width | Minimum print export width |
| --- | --- | --- |
| Horizontal | 160 px | 30 mm |
| Stacked | 96 px | 22 mm |
| Icon | 24 px | 6 mm |
| Wordmark | 120 px | 24 mm |

Favicon exception: supplied 16 px and 32 px browser files. Inspect each output at actual display size.

## Colors
| Name | HEX | Role |
| --- | --- | --- |
| Navy | #0F172A | Wordmark, headings, dark surfaces |
| Cobalt | #164CFF | Primary action, signature blue |
| Ocean | #087DE5 | Gradient continuation |
| Mint | #20BAAA | Accent / progress highlight |
| Deep blue | #1235A4 | Depth inside the symbol |
| Slate | #475569 | Secondary readable text |
| Paper | #F8FAFC | Soft surface |
| White | #FFFFFF | Background / reversed type |
| Border | #DDE5EF | Light dividers |

The vector icon retains the blue-green gradient direction and dark blue depth from the supplied reference. The palette values also support layouts. CMYK values in the PDF are approximate conversions; use a printer color proof for final production.

## Contrast
Use navy, cobalt or slate text on white. Use white text on cobalt or navy. Use navy text on mint. Do not use mint for normal text on white.

| Pair | Ratio |
| --- | --- |
| Navy / White | {contrast(C['navy'],C['white']):.2f}:1 |
| Cobalt / White | {contrast(C['cobalt'],C['white']):.2f}:1 |
| Slate / White | {contrast(C['slate'],C['white']):.2f}:1 |
| Navy / Mint | {contrast(C['navy'],C['mint']):.2f}:1 |
| Mint / White | {contrast(C['mint'],C['white']):.2f}:1 |

WCAG 2.2 normal text: at least 4.5:1. Large text: at least 3:1. Ratios use solid HEX fills. Logotypes have a separate exception; UI text needs its own check.

## Typography
Unbounded Medium 500: logo wordmark only. Space Grotesk SemiBold 600: headings. Manrope Regular 400: body and longer reading. Manrope 600: labels and buttons. Body line height: 1.5-1.6. Web type scale: 48 / 36 / 26 / 16 / 14 / 12 px. Use the included clamp CSS for responsive headings.

Font sources and original license files are included under 06-Fonts. The wordmark and icon are vector paths, so no font installation is required to display logo assets.

## Graphic language
8 px base grid; 4 px optical adjustment. Spacing steps: 8, 16, 24, 32, 48, 64, 96. Corner radii: 8, 16, 24. UI icons: 2 px stroke with rounded ends. Use restrained circular arcs and route accents away from text.

## Voice
Clear, confident, useful, respectful and concise. Use Oprino in sentences and retain oprino in the artwork. Describe concrete next actions. Avoid claims not supported by the product or service.

## Applications
App icon: light or navy background. Social avatar: icon only with sufficient padding. Editable canvases: social 1080 x 1080, cover 1584 x 396, hero 1600 x 900. PNG exports are 2x: 2160 x 2160, 3168 x 792 and 3200 x 1800. These are editable templates, with placeholder copy.

Business card trim: 90 x 55 mm; supplied PDF page 96 x 61 mm including 3 mm bleed. A4 letterhead: 210 x 297 mm. Replace all contact placeholders before production. Stationery PDFs use RGB color.

Email signature: open the HTML template, replace placeholders and host the icon at an HTTPS address before installing it in an email client.

## Protection rules
Do not stretch, rotate, independently recolor logo parts, add effects, crowd the clear space or place the logo directly on a busy background. Keep the mark upright and use an original asset.

## Canva setup
Upload the clean PNG masters for placements and SVG layouts where supported; icon and wordmark are now vector artwork. Add palette values to Brand Hub. Set heading Space Grotesk SemiBold 600 and body Manrope Regular 400. Availability of Brand Hub features depends on the Canva account. The imported guideline and logo-variation documents are designs; they do not themselves configure a Canva Brand Hub object.

## References
- Unbounded: https://fonts.google.com/specimen/Unbounded
- Unbounded OFL: https://github.com/google/fonts/blob/main/ofl/unbounded/OFL.txt
- Space Grotesk: https://fonts.google.com/specimen/Space+Grotesk
- Space Grotesk OFL: https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt
- Manrope: https://fonts.google.com/specimen/Manrope
- Manrope OFL: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
'''
(ROOT/'04-Guidelines/Oprino-Brand-Guidelines.md').write_text(md)

readme='''# Oprino - complete brand kit

Start with `04-Guidelines/Oprino-Brand-Guidelines.pdf` and the brand board.

## What's included
- 16 clean logo variations in fully vector SVG and individual PDF, plus 4096 px transparent PNG masters.
- A 16-page vector logo variation PDF using the faithfully traced pin/check for Canva/import or handoff.
- Full color, reversed, black, white, navy and cobalt versions.
- Horizontal, stacked, icon-only and wordmark layouts.
- App icons, social avatar, browser favicons and a web manifest.
- Social post, cover and web-hero templates.
- Business card front/back (90 x 55 mm trim, 3 mm bleed), A4 letterhead and HTML email signature.
- 17-page brand guideline plus editable Markdown source.
- CSS/JSON design tokens and a GPL color palette.
- Unbounded, Space Grotesk and Manrope font files with original license documents.

## Pick a logo
For a white/light background: horizontal-full-color. For navy: horizontal-reversed. For one-color production: black or white. For compact placements: icon. For a centered cover: stacked.

All logo SVG wordmarks are outlines, with no external font dependency. Logo PNGs preserve transparency. The white files may look blank on a white viewer; use them on a dark surface.

## Template editing
Open SVG files in a vector editor or supported design app. Fonts need to be installed for template text, or use imported PDF templates in Canva. The templates contain intentional placeholder copy and contact details. Replace them before publishing or printing.

The HD icon is a smooth vector trace derived from the supplied pin/check reference. Its recognizable silhouette, pin, check, blue-green palette and depth are preserved. The original screenshot and unmodified crop remain in 07-Source/original-icon for provenance. All logo SVG/PDF artwork uses vector paths, including the Unbounded Medium 500 wordmark with -0.012 em optical tracking.

## Printing
Use the fully vector SVG/PDF layouts for large-format production. Use transparent PNG masters for digital placements. Smooth vector edges stay sharp at different sizes; choose an export resolution appropriate to the final placement. The card PDF has an explicit trim box and 3 mm bleed. Color is RGB; final physical color needs printer proofing. CMYK references in the guideline are approximate.

## Sources
The included font licenses describe use and redistribution. Official references are listed in the guideline. Canary contact details, business claims, a website/domain and an adopted tagline are not part of this kit.
'''
(ROOT/'README.md').write_text(readme.replace('Canary contact details','Final contact details'))
(ROOT/'START-HERE-Hindi.md').write_text('''# Oprino brand kit - shuru yahan se karein

1. Brand guidelines PDF dekhein: 04-Guidelines folder.
2. Website ya normal use: 01-Logos/PNG/Oprino-horizontal-full-color.png.
3. Dark background: Oprino-horizontal-reversed.png.
4. App ya profile: 02-Digital ke app icon aur social avatar.
5. Canva ke liye: PNG upload karein. SVG/PDF mein icon aur wordmark dono vector paths hain. PNG masters 4096 px hain.
6. 03-Templates ke social, cover, web hero, card aur letterhead mein apni details replace karein.
7. Website colors aur responsive typography: 05-Design-Tokens folder.

Is HD kit mein aapke pin/check ka clean vector version hai. Original image aur crop 07-Source/original-icon mein hain. 16 logo variants SVG, PDF aur 4096 px transparent PNG format mein hain. White logo ko dark background par use karein. Business card PDF 90 x 55 mm trim aur 3 mm bleed ke saath hai. Guidelines English mein hain, taaki designer/developer ko seedha handoff diya ja sake.
''')

summary={'guideline_pages':len(doc),'logo_pages':len(sheet),'contrast':{f'{fg}_on_{bg}':round(contrast(C[fg],C[bg]),4) for _,fg,bg in pairs},'pdf_files':4}
(WORK/'pdf-summary.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary))
