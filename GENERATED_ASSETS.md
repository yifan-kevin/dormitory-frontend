# 生成图片记录

本目录中的五张校园照片于 2026-10-04 使用 Codex 内置 image_gen 工具生成，表现的是虚构校园。生成时没有提供原项目照片作为参考或编辑输入。最终 JPEG 保留生成图的完整画面，仅以质量 88 导出为网页用格式；原始 PNG 保留在工具默认的 generated_images 目录。

| 图片文件（相对前端根目录） | 场景 | 使用位置 |
| --- | --- | --- |
| public/images/campus-courtyard.jpg | 宿舍庭院 | 登录页、首页、校园素材列表 |
| public/images/residence-exterior.jpg | 宿舍楼外观 | 校园素材列表 |
| public/images/student-room.jpg | 学生宿舍室内 | 校园素材列表 |
| public/images/residence-corridor.jpg | 宿舍走廊 | 我的宿舍页、校园素材列表 |
| public/images/common-study-area.jpg | 公共学习区 | 个人信息页、校园素材列表 |

前端旧 JPG/PNG 素材已移除，浏览器图标改为本项目绘制的 favicon.svg。账户头像和报修、离校等业务附件来自用户上传接口，不属于这组静态展示素材。

下面记录每张图片实际提交给生成工具的完整提示词。图像生成具有随机性，同样的提示词不会保证获得完全相同的结果。

## campus-courtyard.jpg

```text
Use case: photorealistic-natural. Asset type: landscape photo for the login page and dashboard of a Chinese university dormitory management website. Generate an original fictional campus, not a depiction of an identifiable real university. Scene: a peaceful courtyard framed by modest five-story student residence buildings with warm off-white stucco, pale sandstone detailing and dark forest-green window frames; mature camphor trees, soft morning sunlight, an ordinary clean stone footpath leading toward a residence entrance. Contemporary realistic Chinese campus, appealing and cared for but not a luxury resort. Style: natural editorial architectural photography, photorealistic, 35mm lens, level vertical lines, tactile stone, imperfect foliage and subtle weathering. Framing: one single wide landscape photograph, roughly 16:9, courtyard and architecture remain legible when center-cropped into a 2:1 web panel. Palette: natural muted greens, warm ivory, blue-grey sky, restrained contrast. Avoid people, text, school names, signs, logos, watermarks, collages, borders, cinematic oversaturation, glossy 3D rendering, impossible architecture. Generate only this photograph. This is asset 1 of a coherent original campus photo set.
```

## residence-exterior.jpg

```text
Use case: photorealistic-natural. Asset type: single landscape campus residence exterior photograph for a university housing management website. An original fictional Chinese university residence building: five floors, warm off-white stucco and light sandstone, dark forest-green window frames, simple repeating windows and a few recessed balconies, trees and planted shrubs along the front footpath. Camera at human eye level, a gentle three-quarter view clearly showing the entire modest student residence. Natural late-morning overcast light, true-to-life unpolished material textures and slight everyday weathering, 35mm editorial architecture photography, straight building verticals. A cared-for ordinary campus, not hotel or luxury real estate. Wide landscape roughly 16:9, natural muted greenery and warm ivory palette, quiet realistic atmosphere consistent with a courtyard/room/corridor campus photo set. No real university identity, no people, readable text, signs, logos or watermark, no collage, no frame, no glossy CGI or surreal geometry. Generate only this one photograph.
```

## student-room.jpg

```text
Use case: photorealistic-natural. Asset type: single wide landscape photograph of a Chinese university dormitory interior, an original fictional room for a housing management website. Scene: a realistic tidy four-person student room, four simple sturdy loft beds with desks beneath, warm pale wood desk surfaces, muted forest-green lockers, small personal reading lamps, natural linen bedding, one broad window bringing in soft daylight, a clear practical central aisle. Beds and desks fit together physically, ladders are safely connected and rails correctly constructed, ordinary affordable campus furniture with subtle wear and lived-in texture, tidy but not staged as a hotel or luxury apartment. View from the doorway, architectural editorial photo, 24-28mm lens without exaggerated distortion, straight verticals, believable room size. Wide landscape 16:9 composition, warm ivory, natural wood and muted green colors consistent with other campus photos. No people, real school branding, visible writing, labels, watermarks, logos, collage, glossy 3D rendering or impossible overlapping furniture. Generate only one photograph.
```

## residence-corridor.jpg

```text
Use case: photorealistic-natural. Asset type: single original wide landscape photograph for the accommodation information page of a Chinese university housing website. Scene: a calm well-maintained student residence corridor, warm ivory walls and matte pale stone floor, simple dark forest-green dormitory doors on the left, real large windows on the right overlooking camphor trees. Slightly asymmetrical perspective from eye level, corridor receding naturally toward daylight, handrail, small natural imperfections in the wall and floor, plausible everyday university architecture. Soft late-morning window light, gentle realistic shadows, 28mm architectural editorial photography with true verticals and natural color. Wide landscape about 16:9, compose to retain corridor, doors and greenery within center 2:1 crop. No people, room numbers, posters, writing, institutional identifiers, logos or watermarks, no collage or border, no surreal infinite hallway, no oversaturated color or glossy CGI. Original fictional campus consistent with warm ivory student buildings and muted green fixtures.
```

## common-study-area.jpg

```text
Use case: photorealistic-natural. Asset type: single landscape campus study lounge photo for a university dormitory management site's personal profile page and image library. Original fictional student residence common study area: a simple pale oak communal desk beside tall windows overlooking leafy camphor trees, modest dark forest-green chairs, a few closed unbranded books, practical soft cream walls, a small potted plant, no people. Welcoming, ordinary and cared for, not a luxury office, not a staged cafe. Editorial interior photography, 35mm lens, window daylight, soft truthful shadows, slightly imperfect wood grain and real fabric texture, warm ivory and natural green restrained palette. Wide landscape roughly 16:9, balanced composition that also allows a centered square crop. No readable writing or letters on books, no university names, signs, logos, watermarks, collage, frames, excessive props, sci-fi elements or glossy 3D rendering. Generate only this photograph, consistent with a set showing a fictional Chinese university residence courtyard, building exterior, room and corridor.
```

