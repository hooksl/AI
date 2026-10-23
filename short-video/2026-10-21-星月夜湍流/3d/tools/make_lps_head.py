"""把 three.js 示例里的 Lee Perry-Smith 头部扫描（CC BY 3.0）转成 vendor/lps_head.js。

用法：python3 tools/make_lps_head.py <源目录> vendor/lps_head.js
源目录需含 LeePerrySmith.glb、Map-COL.jpg、Map-SPEC.jpg、Infinite-Level_02_Tangent_SmoothUV.jpg，
下载地址：https://github.com/mrdoob/three.js/tree/r158/examples/models/gltf/LeePerrySmith
只保留脖子以上（扫描自带的肩膀会被外套挡住），几何与贴图都以 base64 内嵌，页面用 file:// 打开也能读。
"""
import base64, io, json, struct, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
d = open(f'{src}/LeePerrySmith.glb', 'rb').read()
cl, _ = struct.unpack('<II', d[12:20]); J = json.loads(d[20:20 + cl])
o = 20 + cl; bl, _ = struct.unpack('<II', d[o:o + 8]); B = d[o + 8:o + 8 + bl]
def view(i, dt, w):
    v = J['bufferViews'][i]; return np.frombuffer(B[v['byteOffset']:v['byteOffset'] + v['byteLength']], dtype=dt).reshape(-1, w)
idx, P, N, UV = view(0, np.uint16, 3), view(1, np.float32, 3), view(2, np.float32, 3), view(3, np.float32, 2)

keep = (P[idx][:, :, 1] > -1.25).all(1)                     # 脖子以上的三角形
idx = idx[keep]
used = np.unique(idx); remap = np.full(len(P), -1, np.int64); remap[used] = np.arange(len(used))
idx = remap[idx].astype(np.uint16); P, N, UV = P[used], N[used], UV[used]

b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
def jpg(path, size=None, gray=False, q=88):
    im = Image.open(path); im = im.convert('L' if gray else 'RGB')
    if size: im = im.resize((size, size), Image.LANCZOS)
    bio = io.BytesIO(); im.save(bio, 'JPEG', quality=q); return 'data:image/jpeg;base64,' + base64.b64encode(bio.getvalue()).decode()

with open(out, 'w') as f:
    f.write('/* Lee Perry-Smith 头部扫描（Infinite Realities），CC BY 3.0：https://creativecommons.org/licenses/by/3.0/\n'
            '   来源：three.js r158 examples/models/gltf/LeePerrySmith；由 tools/make_lps_head.py 生成：裁掉肩膀、base64 内嵌。\n'
            '   坐标：y 向上、脸朝 +z，下巴 y≈-0.5、头顶 y≈4.0（1 单位约 5 厘米）。 */\n')
    f.write('V.LPS = ' + json.dumps({
        'pos': b64(P.astype(np.float32)), 'nrm': b64(N.astype(np.float32)), 'uv': b64(UV.astype(np.float32)), 'idx': b64(idx),
        'col': jpg(f'{src}/Map-COL.jpg', q=92),
        'nmap': jpg(f'{src}/Infinite-Level_02_Tangent_SmoothUV.jpg', q=92),
        'spec': jpg(f'{src}/Map-SPEC.jpg', size=512, gray=True, q=85),
    }) + ';\n')
print(len(P), 'verts', len(idx), 'tris')
