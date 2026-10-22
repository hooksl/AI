# 仓库约定

## 短视频（short-video/）

- 每条视频一个项目目录：`short-video/<日期>-<主题>/`，只提交源码、剧本、分镜等文本；视频、音频由 `short-video/.gitignore` 排除，不进 git。
- **生成的视频成片上传到 Google Drive**：`短视频/<项目名>/` 文件夹，用 `bash short-video/tools/upload_drive.sh <项目名> <文件>...`。
  - 需要环境变量 `RCLONE_CONFIG_GDRIVE_TYPE`、`RCLONE_CONFIG_GDRIVE_SCOPE`、`RCLONE_CONFIG_GDRIVE_TOKEN`（在云环境设置里配置）。缺少时提醒用户配置，不要让用户把凭据贴进对话。
  - Google Drive 连接器只能内嵌文件内容上传，不适合大视频，成片走上面的脚本。
- 不再把视频推到 GitHub 的 `media` 分支（那是 2026-10-22 之前的临时做法）。
