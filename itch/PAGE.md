# 杜鹃森 · itch.io 发布资料

## 上传包

```
sh tools/build-itch.sh          # → dist/shrine-forest-itch.zip（index.html 在 zip 根目录）
```

约 53MB、61 个文件，远低于 itch 网页游戏的限制。所有资源都是相对路径，不需要改代码。

## 新建项目时怎么填（itch.io → Upload new project）

| 栏目 | 填什么 |
|---|---|
| Title | 杜鹃森 — 神社与森林的恋爱物语 |
| Project URL | `shrine-forest`（会变成 你的用户名.itch.io/shrine-forest） |
| Short description | 外婆去世后，你带着一枚旧铜铃回到山上的神社。七天之后就是满月。 |
| Classification | Games |
| Kind of project | **HTML** |
| Release status | Released（想先给朋友测就选 Prototype / In development） |
| Pricing | No payments，或 Donations / 名字你自己定 |
| Uploads | 上传 zip，勾选 **This file will be played in the browser** |

**Embed options**（上传 zip 之后出现）：

- Viewport dimensions：**960 × 640**（横屏电脑上最舒服；手机会自动全屏竖排）
- 勾选 **Mobile friendly**，Orientation 选 **Portrait**（选 Default 的话，itch 会跟着横的嵌入尺寸在手机上横屏打开）
- 勾选 **Fullscreen button**
- **不要**勾 Automatically start on page load（游戏自带「轻触屏幕」开场，用来解锁音乐）
- Frame options 里不用勾 SharedArrayBuffer

**Details**：

- Genre：Visual Novel
- Tags：`visual-novel`, `otome`, `romance`, `yokai`, `japanese`, `shrine`, `cozy`, `emotional`, `multiple-endings`, `chinese`
- Languages：Chinese (Simplified)
- Inputs：Mouse, Touchscreen, Keyboard（按住 Ctrl 跳过已读）
- Average session：按你自己玩一遍的时长填
- Cover image：`cover-630x500.png`（实际 1260×1000，itch 会缩放）
- Screenshots：`shot1` ~ `shot6`

**AI generation disclosure（必填）**：itch 要求如实标注。这个项目里——

- **Graphics：Yes**（立绘、CG、背景、界面都是 AI 生成的）
- **Text / Dialogue：Yes**（剧本由 AI 协作写成）
- **Sound / Music：** 按音乐的实际来源填

先存成 **Draft**，点进页面自己玩一遍（尤其是手机），确认没问题再改成 **Public**。

## 页面正文（直接粘进 Description）

外婆去世了。

整理遗物的时候，你在她的抽屉里找到一枚系着褪色红绳的旧铜铃，和一封信：

「替外婆去山上的神社看看。那里有一群很笨、不太会说话的好孩子。七天，刚好够你认识他们每一个。」

于是你回到了六岁以前住过的山脚小镇，走上了那条长满杜鹃的石阶。

鸟居下面，一只红发的九尾狐提着灯笼在等你。

——她说，等了你二十年。

---

**一部关于「被记住」的和风恋爱视觉小说。**

- 六位攻略对象：爱操心的九尾狐、只会说「……」的银狼、收集人类词语的小鹿、嘴硬的白狼少年、看了你二十年的蓝鹰、住在地底的黑蛇
- 七天，一个满月，六个完整结局，外加一个隐藏结局
- 十五张 CG、八首配乐
- 每个人都有自己的秘密，和一段只属于你们两个人的心动
- 章节选择：玩过的选择会被记住，可以从任意一章重新开始，在流程图里改掉当年的决定
- 跳过已读、八个存档栏、羁绊与记事系统
- 手机、电脑浏览器都能直接玩，无需下载

全中文。

*有名字的东西，被叫到的时候，就会亮。*

---

字体：霞鹜文楷（LXGW WenKai, OFL）、马善政楷书（Ma Shan Zheng, OFL）。
