# 给饶饶的一封信

这是一个把 Word 情书做成网站的私人阅读体验。正文来自根目录的 `.docx`，构建时解析为 `data/letter.json`；原有夏夜、蓝绿色、蝴蝶、阅读进度、音乐和结尾动画均保留。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。生产构建使用 `npm run build`，启动使用 `npm start`。

## 第一次部署：从零创建 Supabase

1. 进入 [supabase.com](https://supabase.com)，创建一个 Project，并等待项目完成初始化。
2. 打开左侧 **SQL Editor**。
3. 在本项目中打开 `supabase/schema.sql`，复制全部内容，粘贴到 SQL Editor，点击 **Run**。
4. 进入 **Table Editor**，确认出现 `confession_responses` 表，包含 `choice`、`message` 和 `submitted_at`。
5. 在 Supabase 项目设置中找到 **Project URL**。
6. 在 API/Connect 页面找到服务器端 **Service Role Secret / Service Role Key**。这个 Key 权限很高，只能放服务器环境变量，不能截图公开、不能写进客户端，也不要用 anon key 代替。

## 环境变量

复制 `.env.example` 为 `.env.local`，填写：

```dotenv
LETTER_PASSWORD=0509
ADMIN_PASSWORD=这里填写管理员密码
SESSION_SECRET=这里填写长随机字符串
NEXT_PUBLIC_SUPABASE_URL=Supabase项目URL
SUPABASE_SERVICE_ROLE_KEY=Supabase服务端密钥
```

真实管理员密码只应存在 `.env.local` 和 Vercel 的环境变量中，不要提交 Git。开发环境可以使用自己的密码；正式发送给对方前，建议重新生成一个新的管理员密码。

启动后可测试普通密码、管理员密码和三个选择。选择记录由服务器写入 Supabase，时间由数据库 `now()` 生成并以台北时区显示；浏览器只保存匿名 HttpOnly `visitor_id`，不收集姓名、手机号、IP、位置或指纹。

## Vercel 环境变量

部署到 Vercel 后进入 **Project → Settings → Environment Variables**，添加以下全部变量：

- `LETTER_PASSWORD`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

保存后重新部署（Redeploy）。修改普通密码或管理员密码时，直接修改对应环境变量并重新部署即可。

## 管理员后台

首页密码框同时接受普通密码和管理员密码。输入管理员密码后会跳转到 `/admin`；普通网页没有管理员链接。后台服务端验证 `admin_session`，按时间倒序显示最新选择和全部选择记录，不展示 UUID、visitor_id 或其他追踪信息。底部的“离开”会清除管理员会话。

也可以在 Supabase 中直接进入 **Table Editor → confession_responses** 检查 `choice`、`message` 与 `submitted_at`。首次升级请执行 `supabase/add_message.sql`，它会补充留言字段、允许只留言记录，并将历史选择统一转换为 `willing`、`friend`、`time`。

### 完整访问轨迹

在已有站点上升级访问统计时，请在 Supabase **SQL Editor** 中执行一次 `supabase/visitor_analytics.sql`。脚本会保留现有 `visitor_logs` 和旧事件字段，并新增 `visitor_sessions`、访问轨迹字段及事件索引。执行后，管理员后台的“访问时间线”会显示每位匿名访客的每次访问、停留时间、页面和行为。

## 更新 Word 正文与音乐

替换根目录 `.docx` 后运行 `npm run parse-letter`；`npm run dev` 和 `npm run build` 会自动解析。音乐文件放到 `public/music/background.mp3`，按钮会在文件不存在时自动隐藏。
