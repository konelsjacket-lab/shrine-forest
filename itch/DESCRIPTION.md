# itch.io 页面排版（Edit game → Description）

整个介绍都是图片，颜色和游戏完全一致。在编辑框里点工具栏的「图片」按钮，按顺序上传这 4 张（不要贴外链，itch 只显示传到 itch 上的图）：

1. page-sec1-story.png     故事
2. page-sec2-cast.png      六个人（角色卡）
3. page-sec3-features.png  特色
4. page-sec4-gallery.png   回忆（CG + 结尾那句话 + 字体署名）

图片之间不用加文字。（想照顾搜索和读屏的话，可以在最下面加一行小字：「和风恋爱视觉小说 · 六位攻略对象 · 七个结局 · 浏览器直接玩 · 全中文」。）

## 主题（Edit theme，在游戏页面上方的工具条里）

- Banner：上传 page-banner.png
- Background：#0e1024
- Background 2（内容底色）：#0e1024（和图片底色一样，图片就会和页面融成一片）
- Text：#f1e8d8
- Link：#f3cf7a
- Button：#c8352a

图片的源文件是 itch/art.html，改了以后 node tools/itch-art.mjs 重新生成。
