@echo off
chcp 65001 >nul
echo ========================================
echo Ollama CORS 配置脚本
echo ========================================
echo.
echo 此脚本将设置 OLLAMA_ORIGINS 环境变量
echo 以允许浏览器访问 Ollama API
echo.

:: 检查是否已设置环境变量
echo [1/3] 检查当前 OLLAMA_ORIGINS 设置...
reg query "HKCU\Environment" /v "OLLAMA_ORIGINS" >nul 2>&1

if %errorlevel% equ 0 (
    echo [INFO] OLLAMA_ORIGINS 已设置，正在检查值...
    for /f "tokens=3*" %%a in ('reg query "HKCU\Environment" /v "OLLAMA_ORIGINS"') do (
        set "current_value=%%a"
    )
    
    if "%current_value%" equ "*" (
        echo [OK] OLLAMA_ORIGINS 已正确设置为 "*"
    ) else (
        echo [INFO] 当前值: %current_value%
        echo [INFO] 需要更新为 "*"
        goto :set_env
    )
) else (
    echo [INFO] OLLAMA_ORIGINS 未设置
    goto :set_env
)

goto :check_ollama

:set_env
echo.
echo [2/3] 设置 OLLAMA_ORIGINS="*"...
setx OLLAMA_ORIGINS "*"

if %errorlevel% equ 0 (
    echo [OK] 环境变量设置成功！
) else (
    echo [错误] 环境变量设置失败
    echo 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo.
echo [重要] 请重启 Ollama 服务以使设置生效
echo.

:check_ollama
echo [3/3] 检查 Ollama 服务状态...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL

if %errorlevel% equ 0 (
    echo [INFO] Ollama 服务正在运行
    echo [提示] 请重启 Ollama 服务:
    echo        1. 停止 Ollama 服务
    echo        2. 重新启动 Ollama 服务
    echo.
    echo 或者运行：
    echo        taskkill /F /IM ollama.exe
    echo        start ollama serve
) else (
    echo [INFO] Ollama 服务未运行
    echo [提示] 启动 Ollama 服务:
    echo        start ollama serve
)

echo.
echo ========================================
echo 操作完成！
echo ========================================
echo 下一步：
echo 1. 重启 Ollama 服务
echo 2. 打开 WebUI 进行测试
echo ========================================
echo.
pause