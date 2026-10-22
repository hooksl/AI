#!/usr/bin/env bash
# upload_drive.sh — 把成片上传到 Google Drive 的「短视频/<项目名>/」文件夹
# 依赖环境变量（在云环境设置里配置，不要写进仓库）：
#   RCLONE_CONFIG_GDRIVE_TYPE=drive
#   RCLONE_CONFIG_GDRIVE_SCOPE=drive.file
#   RCLONE_CONFIG_GDRIVE_TOKEN={"access_token":...,"refresh_token":...}
# 用法: bash short-video/tools/upload_drive.sh <项目名> <文件>...
set -euo pipefail
[ $# -ge 2 ] || { echo "用法: upload_drive.sh <项目名> <文件>..." >&2; exit 2; }
PROJECT="$1"; shift
if [ -z "${RCLONE_CONFIG_GDRIVE_TOKEN:-}" ]; then
  echo "缺少环境变量 RCLONE_CONFIG_GDRIVE_TOKEN：请在云环境设置里配置 Google Drive 凭据" >&2; exit 3
fi
if ! command -v rclone >/dev/null 2>&1; then
  tmp=$(mktemp -d)
  curl -sSL -o "$tmp/rclone.zip" https://downloads.rclone.org/rclone-current-linux-amd64.zip
  unzip -q "$tmp/rclone.zip" -d "$tmp"
  mkdir -p "$HOME/.local/bin" && cp "$tmp"/rclone-*-linux-amd64/rclone "$HOME/.local/bin/"
  export PATH="$HOME/.local/bin:$PATH"
fi
for f in "$@"; do
  rclone copy "$f" "gdrive:短视频/$PROJECT/" --progress --stats-one-line
done
rclone lsl "gdrive:短视频/$PROJECT/"
