#!/bin/bash

# SW-University Test Tracker - Установочный скрипт для Linux/macOS
# Автор: Akinetri
# Дата: 2025-10-31
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SW-University Test Tracker - Установка расширения       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка наличия git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git не установлен. Пожалуйста, установите git.${NC}"
    exit 1
fi

echo -e "${BLUE}➤ Шаг 1: Клонирование репозитория...${NC}"
if [ -d "rubezhka" ]; then
    echo -e "${YELLOW}⚠ Папка 'rubezhka' уже существует. Обновляем...${NC}"
    cd rubezhka
    git fetch origin
    git checkout browser-extension
    git pull origin browser-extension
else
    git clone -b browser-extension https://github.com/Akinetri/rubezhka.git
    cd rubezhka
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Ошибка при клонировании репозитория${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Репозиторий успешно клонирован${NC}"
echo ""

# Создание папки для расширения
echo -e "${BLUE}➤ Шаг 2: Подготовка файлов расширения...${NC}"

# Проверяем структуру файлов
if [ ! -f "manifest.json" ] && [ ! -f "extension/manifest.json" ]; then
    echo -e "${RED}✗ Файл manifest.json не найден${NC}"
    exit 1
fi

# Определяем путь к расширению
if [ -d "extension" ]; then
    EXTENSION_PATH="$(pwd)/extension"
else
    EXTENSION_PATH="$(pwd)"
fi

echo -e "${GREEN}✓ Расширение находится в: ${EXTENSION_PATH}${NC}"
echo ""

# Создание временных иконок (если их нет)
ICONS_DIR="${EXTENSION_PATH}/icons"
if [ ! -d "$ICONS_DIR" ]; then
    echo -e "${BLUE}➤ Создание временных иконок...${NC}"
    mkdir -p "$ICONS_DIR"
    
    # Создаем простые SVG иконки и конвертируем в PNG (если есть ImageMagick)
    if command -v convert &> /dev/null; then
        for size in 16 48 128; do
            convert -size ${size}x${size} xc:blue -fill white -pointsize $((size/2)) \
                    -gravity center -annotate +0+0 "SW" "$ICONS_DIR/icon${size}.png" 2>/dev/null
        done
        echo -e "${GREEN}✓ Временные иконки созданы${NC}"
    else
        echo -e "${YELLOW}⚠ ImageMagick не установлен. Создайте иконки вручную в папке ${ICONS_DIR}/${NC}"
        echo -e "${YELLOW}  Требуются: icon16.png (16x16), icon48.png (48x48), icon128.png (128x128)${NC}"
    fi
fi
echo ""

# Инструкции по установке
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Расширение готово к установке!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Инструкция по установке:${NC}"
echo ""
echo -e "  ${BLUE}1.${NC} Откройте Google Chrome или Chromium"
echo -e "  ${BLUE}2.${NC} Перейдите по адресу: ${GREEN}chrome://extensions/${NC}"
echo -e "  ${BLUE}3.${NC} Включите ${GREEN}«Режим разработчика»${NC} (переключатель в правом верхнем углу)"
echo -e "  ${BLUE}4.${NC} Нажмите кнопку ${GREEN}«Загрузить распакованное расширение»${NC}"
echo -e "  ${BLUE}5.${NC} Выберите папку: ${GREEN}${EXTENSION_PATH}${NC}"
echo ""
echo -e "${YELLOW}⌨  Горячие клавиши после установки:${NC}"
echo -e "  • Нажмите ${GREEN}H${NC} для скрытия/показа индикаторов на странице теста"
echo ""
echo -e "${YELLOW}📂 Путь к расширению скопирован в буфер обмена (если доступно):${NC}"

# Попытка скопировать путь в буфер обмена
if command -v xclip &> /dev/null; then
    echo "$EXTENSION_PATH" | xclip -selection clipboard
    echo -e "  ${GREEN}✓ Скопировано!${NC}"
elif command -v pbcopy &> /dev/null; then
    echo "$EXTENSION_PATH" | pbcopy
    echo -e "  ${GREEN}✓ Скопировано!${NC}"
else
    echo -e "  ${YELLOW}Скопируйте вручную: ${EXTENSION_PATH}${NC}"
fi
echo ""
echo -e "${BLUE}🌐 Открыть chrome://extensions/ сейчас? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "chrome://extensions/" 2>/dev/null || open -a "Google Chrome" "chrome://extensions/" 2>/dev/null
    else
        xdg-open "chrome://extensions/" 2>/dev/null || google-chrome "chrome://extensions/" 2>/dev/null
    fi
    echo -e "${GREEN}✓ Браузер открыт${NC}"
fi
echo ""
echo -e "${GREEN}🎉 Готово! Удачи в прохождении тестов!${NC}"