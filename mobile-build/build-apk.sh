#!/bin/bash

# Skrypt do budowania APK dla TimerIQ
# Upewnij się, że masz zainstalowane Android SDK i Java JDK 17

set -e

echo "🚀 TimerIQ - Build APK Script"
echo "=============================="
echo ""

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sprawdź czy ANDROID_HOME jest ustawione
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ ANDROID_HOME nie jest ustawione${NC}"
    echo "Ustaw ANDROID_HOME w ~/.zshrc:"
    echo "export ANDROID_HOME=\$HOME/Library/Android/sdk"
    exit 1
fi

# Sprawdź czy Java jest zainstalowane
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java nie jest zainstalowane${NC}"
    echo "Zainstaluj Java JDK 17:"
    echo "brew install openjdk@17"
    exit 1
fi

echo -e "${GREEN}✓${NC} ANDROID_HOME: $ANDROID_HOME"
echo -e "${GREEN}✓${NC} Java version: $(java -version 2>&1 | head -n 1)"
echo ""

# Przejdź do katalogu projektu
PROJECT_DIR="/Users/dargrz/timeriq"
cd "$PROJECT_DIR"

echo "📦 Sprawdzanie dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Instalowanie dependencies..."
    npm install
fi

echo ""
echo "📱 Synchronizacja projektu Capacitor..."
npx cap sync android

echo ""
echo "🔨 Budowanie APK..."

# Przejdź do katalogu Android
cd android

# Upewnij się że gradlew jest wykonywalny
chmod +x gradlew

# Zbuduj debug APK
./gradlew assembleDebug

echo ""
echo -e "${GREEN}✅ APK został zbudowany!${NC}"
echo ""
echo "📍 Lokalizacja APK:"
APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
echo -e "${YELLOW}$APK_PATH${NC}"
echo ""

# Skopiuj APK do mobile-build
cp "$APK_PATH" "$PROJECT_DIR/mobile-build/timeriq-debug.apk"
echo -e "${GREEN}✓${NC} Skopiowano do: mobile-build/timeriq-debug.apk"
echo ""

# Wyświetl rozmiar
APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "📊 Rozmiar APK: $APK_SIZE"
echo ""

echo "🎉 Gotowe!"
echo ""
echo "Aby zainstalować na urządzeniu:"
echo "  adb install mobile-build/timeriq-debug.apk"
echo ""
echo "Lub skopiuj plik na telefon i zainstaluj ręcznie."
