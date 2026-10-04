"""Trace the supplied pin/check silhouette into smooth editable SVG paths."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.interpolate import splprep, splev
from scipy.ndimage import label

HERE = Path(__file__).resolve().parent
SOURCE = HERE / 'original-icon/Oprino-supplied-icon-crop.png'

def contours(field, level=0.5):
    h,w=field.shape
    pairs={1:[(3,0)],2:[(0,1)],3:[(3,1)],4:[(1,2)],5:[(3,0),(1,2)],6:[(0,2)],7:[(3,2)],8:[(2,3)],9:[(0,2)],10:[(0,1),(2,3)],11:[(1,2)],12:[(3,1)],13:[(0,1)],14:[(3,0)]}
    graph={}
    for y in range(h-1):
        for x in range(w-1):
            vals=[field[y,x],field[y,x+1],field[y+1,x+1],field[y+1,x]]
            case=sum(1<<i for i,v in enumerate(vals) if v>=level)
            if case in (0,15):continue
            corners=[(x,y),(x+1,y),(x+1,y+1),(x,y+1)]
            def edge(e):
                i,j=e,(e+1)%4
                t=(level-vals[i])/(vals[j]-vals[i])
                return tuple(round(corners[i][k]+t*(corners[j][k]-corners[i][k]),7) for k in (0,1))
            for a,b in pairs[case]:
                pa,pb=edge(a),edge(b)
                graph.setdefault(pa,[]).append(pb);graph.setdefault(pb,[]).append(pa)
    used=set();loops=[]
    for start in graph:
        if start in used:continue
        loop=[];current=start;previous=None
        while current not in used:
            loop.append(current);used.add(current)
            nxt=[p for p in graph[current] if p!=previous]
            if not nxt:break
            previous,current=current,nxt[0]
        if len(loop)>30 and current==start:
            loops.append(np.array(loop,dtype=float))
    def area(a):return abs(np.sum(a[:,0]*np.roll(a[:,1],-1)-a[:,1]*np.roll(a[:,0],-1)))/2
    return sorted([a for a in loops if area(a)>30],key=area,reverse=True)

def path_for(points,smoothing=0.12):
    points=np.vstack([points,points[0]])
    tck,u=splprep(points.T,s=smoothing*len(points),per=True,k=3)
    knots=np.unique(np.asarray(tck[0]));knots=knots[(knots>=0)&(knots<=1)]
    fmt=lambda v: f'{v:.3f}'.rstrip('0').rstrip('.')
    xy=lambda p:fmt(p[0])+','+fmt(p[1])
    start=np.array(splev(0,tck));out=['M'+xy(start)]
    for u0,u1 in zip(knots[:-1],knots[1:]):
        p0=np.array(splev(u0,tck));p1=np.array(splev(u1,tck))
        c1=p0+np.array(splev(u0,tck,der=1))*(u1-u0)/3
        c2=p1-np.array(splev(u1,tck,der=1))*(u1-u0)/3
        out.append('C'+xy(c1)+' '+xy(c2)+' '+xy(p1))
    return ' '.join(out)+' Z'

def build():
    rgb=np.array(Image.open(SOURCE).convert('RGB')).astype(float)
    field=1-rgb.min(axis=2)/255
    paths=contours(field)
    assert len(paths)==3, 'The reference must retain its three colored components.'
    blue,green,dot=[p+0.5 for p in paths]
    # Restore the intentionally circular dot with a fitted circle.
    a=np.column_stack([dot[:,0]*2,dot[:,1]*2,np.ones(len(dot))])
    b=np.sum(dot**2,axis=1)
    cx,cy,c=np.linalg.lstsq(a,b,rcond=None)[0];radius=float(np.sqrt(c+cx*cx+cy*cy))
    dot_path=f'M{cx-radius:.3f},{cy:.3f} a{radius:.3f},{radius:.3f} 0 1 0 {radius*2:.3f},0 a{radius:.3f},{radius:.3f} 0 1 0 {-radius*2:.3f},0 Z'
    blue_labels,_=label(field>=0.5)
    blue_label=int(blue_labels[25,210])
    dark=((rgb[:,:,2]<211)&(rgb[:,:,1]<105)&(blue_labels==blue_label)).astype(float)
    shadows=[path_for(p+0.5,0.35) for p in contours(dark) if len(p)>100][:2]
    output={'version':'1.3','viewbox':[0,0,420,420],
            'provenance':'Smooth vector trace derived from the user-supplied pin/check raster, not an original supplied vector file.',
            'blue':path_for(blue),'green':path_for(green),'dot':dot_path,'shadows':shadows,
            'dot_circle':{'cx':float(cx),'cy':float(cy),'radius':radius}}
    (HERE/'icon-vector-data.json').write_text(json.dumps(output,indent=2)+'\n')
    print({'vector_components':3,'shadow_components':len(shadows),'dot':output['dot_circle']})

if __name__=='__main__':build()
