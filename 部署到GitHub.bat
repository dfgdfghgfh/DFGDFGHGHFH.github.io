@echo off
chcp 65001 >nul
echo ============================================
echo   设定集 Wiki — 一键部署到 GitHub
echo ============================================
echo.
echo 第一步：请确认你的 GitHub 账号已登录
echo   （如果没登录，先执行：git config --global credential.helper manager）
echo.
echo 第二步：按任意键开始推送到 GitHub...
pause >nul

cd /d "%~dp0"
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ✅ 推送成功！
    echo.
    echo 等待 2-3 分钟后访问：
    echo   https://DFGDFGHGHFH.github.io/
    echo.
    echo 后续更新只需：
    echo   1. 修改 wiki-site\docs\ 下的文件
    echo   2. 双击本脚本重新部署
) else (
    echo ❌ 推送失败。请尝试手动操作：
    echo   1. 打开 https://github.com/DFGDFGHGHFH/DFGDFGHGHFH.github.io
    echo   2. 按教程创建仓库
    echo   3. 重新运行本脚本
)
echo.
pause
