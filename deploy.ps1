Write-Host "============================================" -ForegroundColor Cyan
Write-Host "    设定集 Wiki - 部署到 GitHub Pages" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请确保你已经在 GitHub 上创建了仓库：" -ForegroundColor Yellow
Write-Host "  https://github.com/new" -ForegroundColor White
Write-Host "  仓库名: DFGDFGHGHFH.github.io" -ForegroundColor White
Write-Host "  直接点 Create repository（不加任何文件）" -ForegroundColor White
Write-Host ""

$key = Read-Host "已创建好仓库了吗？(y/n)"
if ($key -ne "y") {
    Write-Host "请先去创建仓库，创建好后重新运行此脚本。" -ForegroundColor Red
    exit
}

Set-Location $PSScriptRoot
Write-Host "正在推送到 GitHub..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor Green
    Write-Host " 推送成功！" -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "等待 2-3 分钟后访问：" -ForegroundColor White
    Write-Host "  https://DFGDFGHGHFH.github.io/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "后续更新只需再次运行此脚本。" -ForegroundColor Cyan
} else {
    Write-Host "" -ForegroundColor Red
    Write-Host "推送失败。可能原因：" -ForegroundColor Red
    Write-Host "1. 还没创建 GitHub 仓库" -ForegroundColor Red
    Write-Host "2. GitHub 未登录 - 运行: git config --global credential.helper manager" -ForegroundColor Red
    Write-Host "3. 网络问题" -ForegroundColor Red
}
Read-Host "按回车退出"
