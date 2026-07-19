#!/usr/bin/env python3
"""将 Obsidian 设定集转换为 MkDocs 网站"""
import os, shutil, re, json
from pathlib import Path

VAULT = r"E:\ai\个人剖析项目"
SITE = r"E:\ai\个人剖析项目\wiki-site"
SRC = os.path.join(VAULT, "全套设定集")
DST = os.path.join(SITE, "docs", "设定集")

# 路径映射：设定集中的文件路径 → 网站路径
PATH_MAP = {}
for root, dirs, files in os.walk(SRC):
    for f in files:
        if f.endswith(".md"):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, SRC)
            PATH_MAP[rel] = os.path.join("设定集", rel)

# 额外映射：修仙养成目录的链接
PATH_MAP.update({
    "修仙养成/数据/零之书.md": "https://github.com/DFGDFGHGHFH/cultivation-setting/wiki/零之书",
    "修仙养成/数据/道藏阁.md": "https://github.com/DFGDFGHGHFH/cultivation-setting/wiki/道藏阁",
    "修仙养成/数据/系统/config.json": "https://github.com/DFGDFGHGHFH/cultivation-setting/blob/main/data/config.json",
    "修仙养成/数据/系统/techniques_full.json": "https://github.com/DFGDFGHGHFH/cultivation-setting/blob/main/data/techniques_full.json",
    "修仙养成/数据/系统/scriptures.json": "https://github.com/DFGDFGHGHFH/cultivation-setting/blob/main/data/scriptures.json",
    "修仙养成/数据/系统/ai-journal-prompt.md": "https://github.com/DFGDFGHGHFH/cultivation-setting/wiki/镜的提示词",
    "修仙养成/数据/系统/training.json": "https://github.com/DFGDFGHGHFH/cultivation-setting/blob/main/data/training.json",
})

def convert_wikilinks(content: str, src_path: str) -> str:
    """转换 [[wikilink]] 为 [text](path)"""
    def replace_wikilink(m):
        link = m.group(1)
        text = m.group(2) or link

        # 处理带路径的链接
        if "/" in link:
            # 已经是路径格式，直接查找
            target = link
        else:
            # 查找匹配的文件
            target = None
            for p in PATH_MAP:
                fn = os.path.splitext(os.path.basename(p))[0]
                if fn == link:
                    target = PATH_MAP[p]
                    break

        if target:
            return f"[{text}](/{target})"
        else:
            # 找不到映射，保持原样
            return text

    # 匹配 [[link]] 和 [[link|text]]
    content = re.sub(r'\[\[([^\]|]+)(?:\|([^\]|]+))?\]\]', replace_wikilink, content)

    # 转换 DataviewJS 代码块为普通代码块（MkDocs 不执行 Dataview）
    content = re.sub(r'```dataviewjs\s*\n(.*?)```', r'```javascript\n\1```', content, flags=re.DOTALL)
    content = re.sub(r'```dataview\s*\n(.*?)```', r'```sql\n\1```', content, flags=re.DOTALL)

    return content

def copy_files():
    """复制并转换文件"""
    for root, dirs, files in os.walk(SRC):
        for f in files:
            if not f.endswith(".md"):
                continue

            src_path = os.path.join(root, f)
            rel_path = os.path.relpath(src_path, SRC)
            dst_path = os.path.join(DST, rel_path)

            os.makedirs(os.path.dirname(dst_path), exist_ok=True)

            with open(src_path, "r", encoding="utf-8") as fh:
                content = fh.read()

            # 转换 wiki-links
            content = convert_wikilinks(content, src_path)

            # 移除 frontmatter（MkDocs 有自己的 frontmatter 系统）
            content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)

            with open(dst_path, "w", encoding="utf-8") as fh:
                fh.write(content)

            print("  OK " + rel_path)

print("[转换] 开始处理设定集文件...")
copy_files()

# 复制世界地图数据
os.makedirs(os.path.join(SITE, "docs", "data"), exist_ok=True)
shutil.copy2(
    os.path.join(VAULT, "修仙养成", "数据", "系统", "world-map.json"),
    os.path.join(SITE, "docs", "data", "world-map.json")
)
shutil.copy2(
    os.path.join(VAULT, "修仙养成", "数据", "系统", "人物志数据.json"),
    os.path.join(SITE, "docs", "data", "人物志数据.json")
)
print("  OK 地图数据")
print("[完成] 转换结束")
