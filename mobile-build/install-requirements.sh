#!/bin/bash

# Instalacja wymagań do budowania APK na macOS

set -e

echo "🔧 Instalacja wymagań dla budowania Android APK"
echo "================================================"
echo ""

# Kolory
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Sprawdź Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew nie znalezione. Zainstaluj z https://brew.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} Homebrew znalezione"
echo ""

# Instaluj Java JDK 17
echo "📦 Instalowanie Java JDK 17..."
if ! brew list openjdk@17 &> /dev/null; then
    brew install openjdk@17
    echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
    echo -e "${GREEN}✓${NC} Java JDK 17 zainstalowane"
else
    echo -e "${GREEN}✓${NC} Java JDK 17 już zainstalowane"
fi

# Instaluj Android Command Line Tools
echo ""
echo "📱 Instalowanie Android Command Line Tools..."
if ! brew list android-commandlinetools &> /dev/null; then
    brew install --cask android-commandlinetools
    echo -e "${GREEN}✓${NC} Android Command Line Tools zainstalowane"
else
    echo -e "${GREEN}✓${NC} Android Command Line Tools już zainstalowane"
fi

# Konfiguracja zmiennych środowiskowych
echo ""
echo "⚙️  Konfigurowanie zmiennych środowiskowych..."

if ! grep -q "ANDROID_HOME" ~/.zshrc; then
    cat >> ~/.zshrc << 'EOF'

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/tools:$PATH
export PATH=$ANDROID_HOME/tools/bin:$PATH
EOF
    echo -e "${GREEN}✓${NC} Zmienne środowiskowe dodane do ~/.zshrc"
fi

# Załaduj zmienne
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH

# Utwórz katalogi SDK
mkdir -p $ANDROID_HOME/cmdline-tools

echo ""
echo "📥 Instalowanie komponentów Android SDK..."

# Instaluj SDK platform-tools
if [ -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "Instalowanie platform-tools, platforms i build-tools..."
    yes | sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
    yes | sdkmanager --licenses
    echo -e "${GREEN}✓${NC} Komponenty SDK zainstalowane"
else
    echo -e "${YELLOW}⚠${NC}  Musisz ręcznie skonfigurować cmdline-tools"
    echo "Pobierz z: https://developer.android.com/studio#command-tools"
    echo "Wypakuj do: $ANDROID_HOME/cmdline-tools/latest"
fi

echo ""
echo -e "${GREEN}✅ Instalacja zakończona!${NC}"
echo ""
echo "⚠️  WAŻNE: Uruchom ponownie terminal lub wykonaj:"
echo "  source ~/.zshrc"
echo ""
echo "Następnie możesz zbudować APK używając:"
echo "  bash mobile-build/build-apk.sh"
