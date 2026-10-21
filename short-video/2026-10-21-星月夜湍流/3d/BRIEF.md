# 3D 版《星月夜的湍流》· 镜头搭建简报

给每个负责一段镜头的搭建者看。整片 140 秒，1920×1080 / 30fps，three.js r158（UMD，全局 `THREE`）+ Canvas 2D 覆盖层。

## 0. 这次要做成什么

用户的原话：**"不要幻灯片形式，要 3D 动画。"** 上一版是平面卡片轮流淡入淡出，被否掉了。所以每一段都必须满足：

1. **镜头一直在 3D 空间里运动**：推、拉、环绕、升降、穿越都可以，相机位置和朝向每帧都在变，绝不静止超过 1 秒。
2. **有景深和视差**：画面里要有前景、中景、背景层次，相机移动时它们以不同速度掠过。背景天幕 `V.backdrop` 本身就是远景。
3. **知识内容是 3D 空间里的物体**：纸张漂浮、翻转、轻微卷曲；坐标线是发光的管；漩涡由立体分布的笔触组成。**禁止**贴在屏幕上的全屏平面卡片，禁止"出现一张卡 → 停住 → 淡出"的幻灯片节奏。
4. **视觉语言统一为梵高笔触**：主要用 `V.Strokes` 画短笔触（两端收尖、带刷毛纹理）。配色用 `V.PAL`（星月夜的深蓝、浅蓝、奶黄、金黄），强调色为金 `#E8C547`，纸张米白 `#EDE4D3`，红印章 `#B53A2F`。不要做成霓虹或科幻风，也不要出现没有笔触处理的光秃几何体。
5. **字要读得清**：关键文字在屏幕上的字高 ≥ 36px，观看角度不要过斜（< 45°），文字背后要有足够对比。

可以参考 `shots/s01_open.js`（开场）和 `shots/s12_end.js`（结尾），这两段已经完成，是质量和风格的基准。

## 1. 屏幕布局约束（覆盖层已占用的区域）

- 顶部标签：y 44–80px（居中）
- 画面注释：y ≈ 740–775px（居中小字）
- 双语字幕：y 890–1010px（居中大字），底部有暗色渐变
- **关键 3D 内容请放在屏幕 y 110–720px 的区域**，左右留 ≥ 80px 边距。

## 2. 技术契约（必须遵守）

- 画面**只由 t 决定**：`update(t, lt, ctx)` 每帧根据 t 从零计算所有状态。禁止 `Math.random`、`Date`、`performance.now`、跨帧累积变量。随机数一律用 `V.rng(seed)`，并且只在 `build` 里生成。
- **性能**：渲染走 SwiftShader 软件 WebGL，全片 4200 帧。单个镜头的笔触实例数控制在 2.5 万以内，Canvas 贴图 ≤ 2048px。卡片只在内容变化时 `redraw(t)`：把进度量化（例如每 0.1 秒一档），用 `ctx.state` 记住上次画的档位，档位相同就不重画（这属于缓存，不算跨帧状态，画面仍只由 t 决定）。
- **只能修改分配给你的文件**（`shots/` 下你的那几个文件）。不要改 `core.js`、`world.js`、`overlay.js`、`index.html`、`paint2d.js` 和别人的镜头。需要改核心的地方，写在最终报告的 `coreRequests` 里。
- 镜头首尾约 0.35 秒会被笔触转场（`V.CUTS`）遮住，但这段时间也必须正常渲染。

## 3. API 速查

### 注册镜头
```js
V.shot({ id:'s05', start:46, end:54, origin:[12000,0,0],   // 非世界镜头：各自独立的远处原点（占位文件里已给）
  useWorld:false,          // true → 显示 3D 星月夜世界（origin 应为 [0,0,0]，使用世界坐标），背景天幕自动隐藏
  backdrop:true,           // false → 隐藏背景天幕
  build(ctx){ /* 只执行一次：建模型、生成随机数据，挂到 ctx.group */ },
  update(t, lt, ctx){ /* 每帧：t 为全片秒数，lt = t - start；必须设置相机 */ },
});
```
`ctx = { group, origin, state, cam(posLocal, targetLocal, fov=50, roll=0), local(x,y,z) }`：`ctx.cam` 用局部坐标设相机。也可以直接用 `V.setCam(worldPos, worldTarget, fov, roll)`。

### 工具
- `V.E(t,a,b)` 缓动进度，`V.P` 线性进度，`V.vis(t,a,b,fadeIn,fadeOut)` 可见度，`V.keys(t, [[t0,v0],[t1,v1],...])` 关键帧插值（数字、数组或 Vector3），`V.spline([Vector3...])` 返回 `u→Vector3`，`V.lerp`、`V.clamp`、`V.easeOut`、`V.easeIn`、`V.smooth`，`V.rng(seed)`，`V.hex('#rrggbb')→[r,g,b]`，`V.v3(x,y,z)`
- `V.PAL`：调色板（deep / mid / pale / yel / cream / teal / moon / cypress）；`V.COL`：gold / ink / dim / paper / seal / blue；`V.FONT`：SANS / SERIF / GARA（EB Garamond）/ MATH（含希腊字母和数学符号）

### 笔触 `V.Strokes`（CPU 驱动，相机朝向的带状笔触）
```js
const s = new V.Strokes(n, {additive:false, shape:'brush'|'glow'|'dot', opacity:1, renderOrder:0, depthTest:true});
group.add(s.mesh);
s.set(i, x,y,z, dx,dy,dz, len, wid, [r,g,b], alpha);   // 局部坐标；方向 (dx,dy,dz) 为笔触长度方向
s.hide(i); s.commit();                                  // 每帧设置完调用 commit
```
`glow` 加 `additive:true` 适合做星光、能量粒子和高光。

### 漩涡天空笔触 `V.SkyStrokes`（GPU 动画，适合大量绕中心旋转的笔触）
参考 `world.js` 里的用法：type 0 绕中心旋转，type 1 沿切向流动；uniform 为 `phase`、`reveal`、`opacity`。

### Canvas 贴图卡片 `V.card`
```js
const card = V.card({w:30, h:20, px:1536, draw(c, W, H, t){ V.drawPaper(c,W,H); V.txt(c,'标题',W/2,80,`700 64px ${V.FONT.SERIF}`,'#2a2218'); }});
group.add(card.mesh); card.redraw(t); card.opacity = 0.8;
```
平面正面朝 +z，用 `mesh.lookAt(...)` 或旋转来摆放。想让纸张卷曲、飘动，可以把 `card.mesh.geometry` 换成细分的 `PlaneGeometry(w,h,32,24)`，每帧按 t 改顶点位置（记得 `attributes.position.needsUpdate = true`）。
2D 工具：`V.txt(c,s,x,y,font,color,align,alpha)`、`V.roundRect`、`V.drawPaper(c,W,H)`、`V.drawSeal(c,x,y,text,k,size)`。

### 平面版绘画工具 `V.paint2d`（可画进 Canvas 贴图）
`drawStarry(c,t,cx,cy,W,{reveal,alpha})` 画整幅程序化星月夜（画宽 W，画高 0.8W）；`drawPortrait(c,x,y,w,h,t)` 画《叼烟斗、缠绷带的自画像》剪影；`drawFit(c,x,y,w,h,k,good,t)` 画理论（金虚线）对比数据（白线）的曲线；`logE(X)`、`noise(X)`、`XA=0.6`、`XB=2.04` 是频谱数据的分段函数（X 为 0..3 个数量级）。

### 3D 星月夜世界（仅 `useWorld:true` 的镜头）
- `V.P0 = (0,14,70)` 原画视点；`V.T0 = (0,52,-60)` 原画视线目标。站在 P0、看向 T0、fov 50 时，构图对应原画。
- `V.world.features[i]`：`{k:'swirl'|'moon'|'star', u, v, r, C(Vector3 世界中心), rW(世界半径), n(朝外法向), e1, e2(切向基), extra}`。前 12 个（`extra` 为假）对应画中的漩涡、月亮和星星。
- `V.world.set({reveal:0..1, phase:秒, opacity})`：控制天空笔触出现比例、旋转相位（默认 phase = t）、整体透明度。每帧都要设置，未设置时恢复默认。
- 病房：`V.world.WIN = {z:76, w:10, h:13, y0:8.5}`，窗洞 x∈[-5,5]，y∈[8.5,21.5]，上沿为半圆拱。竖铁栏在 x = -3、-1、1、3，横铁栏在 y = 11.5、14.8、18.1（都在 z ≈ 76.5）。室内为 z 76–94，地板 y = 5，天花板 y = 24；床在 x = -9，桌子和画架在 x = 8.5。`V.world.room` 和 `V.world.bars` 都是 Group。
- 柏树在 (-15,0,40)，高 47；教堂在 (14,0,-58)，尖塔顶约 y = 34；村庄范围 x -90..100，z -108..-26。

### 2D 覆盖层（尽量少用）
`V.overlayHooks.push((c, t, act) => {...})` 在 3D 画面之上画 2D 内容，仅用于确实需要的平面元素。字幕、标签和注释已由 `overlay.js` 处理。
`V.setSection(起秒, 顶标签, 注释)` 可修改你时间段内某条章节注释（起秒必须与 `V.SECTIONS` 中已有的一致），用于画面和原注释不符的情况。

## 4. 预览与自检

```bash
cd /home/user/AI/short-video/2026-10-21-星月夜湍流/3d
python3 tools/preview.py index.html <你的临时目录> 46.2 47 48.5 50 52 53.8   # 渲染这些时刻
# 然后用 Read 工具查看 <你的临时目录>/sheet.jpg（6 格以上会自动加行）
```
- 临时目录用 `/tmp/claude-0/-home-user-AI/5dc8e7e7-d0e0-5c97-8c8b-40c898ab3c76/scratchpad/agents/<镜头id>/<轮次>/`，不要写进仓库。
- 输出中出现 `JSERR` 或 `CONSOLE.error` 就是 bug，必须修掉。
- **确定性检查**：同一个 t 在渲染过其他时刻后再渲染一次，画面必须完全一致。
- 自检至少覆盖：每 1–1.5 秒一帧，加上剧本里每个节拍的时刻。连续两帧看起来几乎一样（相机没动），就说明是"幻灯片"，要改。
- 单帧渲染约 0.5–1 秒，别一次渲染太多帧，按需分批。

## 5. 剧本与事实

字幕时间轴在 `overlay.js` 的 `V.SUBTITLES`，画面节拍必须和字幕对上。事实以 `../script.md`、`../NOTES.md` 为准，**不要新增事实性内容**（年份、人名、数字、引文）。纸张上的文字沿用 v1 平面版（`../index.html`）里已经核实过的写法。
