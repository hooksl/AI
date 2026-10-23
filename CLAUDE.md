# 仓库约定

## 短视频（short-video/）

- 每条视频一个项目目录：`short-video/<日期>-<主题>/`，只提交源码、剧本、分镜等文本；视频、音频由 `short-video/.gitignore` 排除，不进 git。
- **生成的视频成片上传到 Google Drive**：`短视频/<项目名>/` 文件夹，用 `bash short-video/tools/upload_drive.sh <项目名> <文件>...`。
  - 需要环境变量 `RCLONE_CONFIG_GDRIVE_TYPE`、`RCLONE_CONFIG_GDRIVE_SCOPE`、`RCLONE_CONFIG_GDRIVE_TOKEN`（在云环境设置里配置）。缺少时提醒用户配置，不要让用户把凭据贴进对话。
  - 用户选择的 rclone 权限为 **`drive`（完全访问整个云盘）**，因此：
    - 只用 `rclone copy` 上传，**禁止使用 `rclone sync`**（sync 会删除目标端多出的文件）。
    - 删除、覆盖、移动、重命名用户已有的文件之前，必须先列出要动的文件并得到用户确认；删除只移到回收站，不加 `--drive-use-trash=false`。
    - 不浏览、不下载与当前任务无关的文件。
- 日常管理云盘（找文件、建文件夹、移动、分享、读文档）优先用 Google Drive 连接器；分享、改权限前同样先确认。
  - Google Drive 连接器只能内嵌文件内容上传，不适合大视频，成片走上面的脚本。
- 不再把视频推到 GitHub 的 `media` 分支（那是 2026-10-22 之前的临时做法）。
