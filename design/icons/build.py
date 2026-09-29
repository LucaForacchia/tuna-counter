"""Generate foreground.svg: a curved tuna leaping out of an oil-filled can."""
import math, re

RB = 290.0          # bend radius of the fish centreline (smaller = more curved)
ROT = -33           # overall fish rotation (degrees)
ENTRY_LOCAL = -80   # local x where the fish pierces the oil surface
ENTRY = (425, 646)  # where that point lands on screen (on the oil surface)
WX, WY, WRX, WRY = 452, 648, 112, 26  # waterline ellipse around the fish

# ---------- geometry helpers ----------
def bez(p0, p1, p2, p3, n=28):
    out = []
    for i in range(1, n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                    u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    return out

def flatten(d):
    """Parse a path made of absolute M/C/L/Z into polylines."""
    toks = re.findall(r'[MCLZ]|-?\d+\.?\d*', d)
    polys, cur, i = [], [], 0
    while i < len(toks):
        c = toks[i]; i += 1
        if c == 'M':
            if cur: polys.append(cur)
            cur = [(float(toks[i]), float(toks[i+1]))]; i += 2
        elif c == 'L':
            cur.append((float(toks[i]), float(toks[i+1]))); i += 2
        elif c == 'C':
            pts = [(float(toks[i+k]), float(toks[i+k+1])) for k in (0, 2, 4)]; i += 6
            cur += bez(cur[-1], *pts)
        elif c == 'Z':
            pass
    if cur: polys.append(cur)
    return polys

def warp(p):
    """Bend local fish coords around an arc: head and tail both drop -> arched leap."""
    x, y = p
    th = x / RB
    return ((RB - y) * math.sin(th), RB - (RB - y) * math.cos(th))

def to_d(polys, close=True):
    s = ''
    for poly in polys:
        w = [warp(p) for p in poly]
        s += 'M ' + ' L '.join(f'{a:.1f},{b:.1f}' for a, b in w) + (' Z ' if close else ' ')
    return s.strip()

# ---------- fish parts in straight local coords (head at +x, belly at +y) ----------
BODY = "M 205,0 C 178,-46 95,-78 5,-80 C -85,-78 -150,-42 -192,-10 L -192,10 C -150,42 -85,74 5,76 C 95,72 178,42 205,0 Z"
BELLY = "M 205,0 C 170,10 90,16 5,14 C -80,12 -150,8 -192,4 L -192,10 C -150,42 -85,74 5,76 C 95,72 178,42 205,0 Z"
MID = "M 205,0 C 170,-6 90,-8 5,-12 C -80,-14 -150,-6 -192,-2 L -192,6 C -150,10 -80,14 5,16 C 90,18 170,10 205,0 Z"
TAIL = "M -188,-8 C -212,-32 -238,-62 -262,-92 C -252,-45 -246,-18 -238,0 C -246,18 -252,45 -262,92 C -238,62 -212,32 -188,8 Z"
DORSAL = "M -10,-74 C 0,-110 20,-128 40,-134 C 38,-110 40,-90 48,-70 Z"
ANAL = "M -40,68 C -30,95 -15,108 5,114 C 4,95 8,80 14,66 Z"
PECT = "M 100,4 C 60,10 10,26 -30,48 C 20,40 70,30 108,20 Z"
FINLETS = []
for (x, y, s) in [(-70, -68, 1), (-100, -58, 1), (-128, -46, .9), (-155, -32, .8)]:
    FINLETS.append(f"M {x},{y} L {x-8*s},{y-22*s} L {x+22*s},{y-8*s} Z")
    FINLETS.append(f"M {x},{-y-4} L {x-8*s},{-y-4+22*s} L {x+22*s},{-y-4+8*s} Z")
LATERAL = "M 115,-4 C 40,-10 -60,-8 -170,0"
GILL = "M 128,-52 C 110,-20 110,20 130,48"
MOUTH = "M 205,0 C 190,6 178,10 168,12"

def wpt(x, y):
    a, b = warp((x, y)); return f'cx="{a:.1f}" cy="{b:.1f}"'

# placement: rotate then translate so ENTRY_LOCAL lands on ENTRY
ex, ey = warp((ENTRY_LOCAL, 0))
r = math.radians(ROT)
rx, ry = ex*math.cos(r) - ey*math.sin(r), ex*math.sin(r) + ey*math.cos(r)
TX, TY = ENTRY[0] - rx, ENTRY[1] - ry

fish = f'''
  <g transform="translate({TX:.1f} {TY:.1f}) rotate({ROT})">
    <path d="{to_d(flatten(TAIL))}" fill="#1E4468"/>
    <path d="{to_d(flatten(DORSAL))}" fill="#1E4468"/>
    <path d="{to_d(flatten(ANAL))}" fill="#C9D6E0"/>
    <path d="{to_d(flatten(BODY))}" fill="#1D4266"/>
    <path d="{to_d(flatten(MID))}" fill="#4F7A9E" opacity="0.9"/>
    <path d="{to_d(flatten(BELLY))}" fill="#E6EDF3"/>
    <path d="{to_d(flatten(BODY))}" fill="url(#sheen)"/>
    <g fill="#FFC53D">{''.join(f'<path d="{to_d(flatten(f))}"/>' for f in FINLETS)}</g>
    <path d="{to_d(flatten(LATERAL), False)}" fill="none" stroke="#7FA0BC" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
    <path d="{to_d(flatten(GILL), False)}" fill="none" stroke="#16324F" stroke-width="7" stroke-linecap="round" opacity="0.55"/>
    <path d="{to_d(flatten(PECT))}" fill="#2A5A82"/>
    <circle {wpt(160,-14)} r="17" fill="#FFFFFF"/>
    <circle {wpt(164,-14)} r="9" fill="#0E1E2E"/>
    <circle {wpt(167,-18)} r="3" fill="#FFFFFF"/>
    <path d="{to_d(flatten(MOUTH), False)}" fill="none" stroke="#16324F" stroke-width="5" stroke-linecap="round"/>
  </g>'''

# direction of the fish at the entry point (tangent), to orient the cut line
t_th = ENTRY_LOCAL / RB + r
tx, ty = math.cos(t_th), math.sin(t_th)     # pointing towards the head
# submerged region = oil ellipse ∩ tail-side half-plane (polygon), cut out of the visible area
P = ENTRY
def tail_side(q):  # >0 on tail side of the line through P perpendicular to the fish
    return -((q[0]-P[0])*tx + (q[1]-P[1])*ty)
def ell_pts(cx, cy, a, b, n=240):
    return [(cx + a*math.cos(2*math.pi*k/n), cy + b*math.sin(2*math.pi*k/n)) for k in range(n)]
def clip_half(poly):
    out = []
    for i in range(len(poly)):
        A, B = poly[i], poly[(i+1) % len(poly)]
        fa, fb = tail_side(A), tail_side(B)
        if fa >= 0: out.append(A)
        if (fa >= 0) != (fb >= 0):
            t = fa / (fa - fb); out.append((A[0]+t*(B[0]-A[0]), A[1]+t*(B[1]-A[1])))
    return out
CX, CY, RX, RY = 430, 640, 200, 62          # can opening
OX, OY, ORX, ORY = 430, 652, 186, 54         # oil surface (a bit lower = inner wall visible)

sub = clip_half(ell_pts(OX, OY, ORX, ORY))
# waterline: front arc of the ripple ellipse around the entry point, flat elsewhere
wl = []
for k in range(0, 1025, 4):
    dx = (k - WX) / WRX
    wl.append((k, WY + (WRY*math.sqrt(1 - dx*dx) if abs(dx) < 1 else 0)))
WL_D = 'M ' + ' L '.join(f'{a:.1f},{b:.1f}' for a, b in wl) + ' L 1024,1024 L 0,1024 Z'
SUB_D = 'M ' + ' L '.join(f'{a:.1f},{b:.1f}' for a, b in sub) + ' Z'

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="canBody" x1="230" y1="0" x2="630" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8E9AA6"/><stop offset="0.25" stop-color="#E9EEF2"/>
      <stop offset="0.45" stop-color="#C3CDD5"/><stop offset="0.8" stop-color="#F4F7F9"/>
      <stop offset="1" stop-color="#9AA6B1"/>
    </linearGradient>
    <linearGradient id="label" x1="230" y1="0" x2="630" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#C9442C"/><stop offset="0.3" stop-color="#FF7A5C"/>
      <stop offset="0.75" stop-color="#F26B4F"/><stop offset="1" stop-color="#C9442C"/>
    </linearGradient>
    <linearGradient id="lid" x1="0" y1="-70" x2="0" y2="70" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F4F7F9"/><stop offset="0.5" stop-color="#C6D0D8"/>
      <stop offset="1" stop-color="#8E9AA6"/>
    </linearGradient>
    <linearGradient id="wall" x1="0" y1="{CY-RY}" x2="0" y2="{CY+RY}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#46525D"/><stop offset="0.5" stop-color="#8793A0"/>
    </linearGradient>
    <radialGradient id="oil" cx="{OX-40}" cy="{OY-18}" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7D774"/><stop offset="0.6" stop-color="#E2AE3C"/>
      <stop offset="1" stop-color="#B9801F"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="-80" x2="0" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.3" stop-color="#FFFFFF" stop-opacity="0.18"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="oilClip"><ellipse cx="{OX}" cy="{OY}" rx="{ORX}" ry="{ORY}"/></clipPath>
    <clipPath id="belowWater"><path d="{WL_D}"/></clipPath>
    <clipPath id="aboveOil"><rect x="0" y="0" width="1024" height="{OY+ORY+2}"/></clipPath>
  </defs>

  <!-- peeled lid, hinged on the back-left rim -->
  <g transform="translate(300 560) rotate(-58)">
    <ellipse cx="0" cy="0" rx="168" ry="58" fill="url(#lid)" stroke="#7D8994" stroke-width="8"/>
    <ellipse cx="0" cy="0" rx="120" ry="38" fill="none" stroke="#A9B4BE" stroke-width="6"/>
    <ellipse cx="0" cy="0" rx="72" ry="22" fill="none" stroke="#A9B4BE" stroke-width="6"/>
  </g>

  <!-- inside of the can: inner wall + oil surface -->
  <ellipse cx="{CX}" cy="{CY}" rx="{RX}" ry="{RY}" fill="url(#wall)"/>
  <ellipse cx="{OX}" cy="{OY}" rx="{ORX}" ry="{ORY}" fill="url(#oil)"/>
  <ellipse cx="{OX-60}" cy="{OY-22}" rx="70" ry="10" fill="#FFF3C4" opacity="0.55"/>
  <path d="M {CX-RX},{CY} A {RX},{RY} 0 0 1 {CX+RX},{CY}" fill="none" stroke="#8E9AA6" stroke-width="10"/>

  <!-- ripples where the fish breaks the surface -->
  <g clip-path="url(#oilClip)" fill="none" stroke="#FFF1B8" stroke-linecap="round">
    <ellipse cx="{WX}" cy="{WY}" rx="{WRX}" ry="{WRY}" stroke-width="7" opacity="0.9"/>
    <ellipse cx="{WX}" cy="{WY}" rx="{WRX+48}" ry="{WRY+14}" stroke-width="5" opacity="0.55"/>
  </g>

  <!-- tuna leaping out (tail hidden below the oil) -->
  <g clip-path="url(#aboveOil)">{fish}
  </g>

  <!-- oil surface in front of the submerged part of the fish -->
  <g clip-path="url(#belowWater)"><ellipse cx="{OX}" cy="{OY}" rx="{ORX}" ry="{ORY}" fill="url(#oil)"/>
    <ellipse cx="{WX}" cy="{WY}" rx="{WRX}" ry="{WRY}" fill="none" stroke="#FFF1B8" stroke-width="7" opacity="0.9"/></g>
  <!-- front half of the ripples, in front of the fish -->
  <g clip-path="url(#oilClip)" fill="none" stroke="#FFF1B8" stroke-linecap="round">
    <path d="M {WX-WRX-48},{WY} A {WRX+48},{WRY+14} 0 0 0 {WX+WRX+48},{WY}" stroke-width="5" opacity="0.55"/>
  </g>

  <!-- can body (front wall) -->
  <path d="M 230,640 A 200,62 0 0 0 630,640 L 630,790 A 200,62 0 0 1 230,790 Z" fill="url(#canBody)"/>
  <path d="M 230,678 A 200,62 0 0 0 630,678 L 630,762 A 200,62 0 0 1 230,762 Z" fill="url(#label)"/>
  <path d="M 230,690 A 200,62 0 0 0 630,690" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.85"/>
  <path d="M 230,750 A 200,62 0 0 0 630,750" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.85"/>
  <path d="M 230,640 A 200,62 0 0 0 630,640" fill="none" stroke="#E9EEF2" stroke-width="14" stroke-linecap="round"/>
  <path d="M 230,790 A 200,62 0 0 0 630,790" fill="none" stroke="#7D8994" stroke-width="10"/>

  <!-- flying oil droplets -->
  <g fill="#F7D774">
    <ellipse cx="338" cy="598" rx="10" ry="14" transform="rotate(-30 338 598)"/>
    <circle cx="352" cy="568" r="6"/>
    <ellipse cx="652" cy="616" rx="11" ry="15" transform="rotate(30 652 616)"/>
    <circle cx="678" cy="590" r="7"/>
  </g>
</svg>
'''
open('foreground.svg', 'w').write(svg)
print('fish translate', round(TX), round(TY))
