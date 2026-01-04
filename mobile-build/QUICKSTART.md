# TimerIQ Mobile Build - Quick Start

## Obecny status

✅ Capacitor zainstalowany i skonfigurowany
✅ Platforma Android dodana
✅ Skrypty budowania przygotowane
⚠️  Wymaga instalacji Android SDK

## Szybki start - Budowanie APK

### Krok 1: Instalacja wymagań

```bash
# Automatyczna instalacja (zalecane)
bash mobile-build/install-requirements.sh

# Po instalacji, załaduj zmienne środowiskowe:
source ~/.zshrc
```

### Krok 2: Budowanie APK

```bash
# Metoda 1: Używając skryptu (najłatwiejsze)
bash mobile-build/build-apk.sh

# Metoda 2: Ręcznie
npx cap sync android
cd android
./gradlew assembleDebug
```

### Krok 3: Instalacja na urządzeniu

```bash
# Podłącz urządzenie Android lub uruchom emulator
adb devices

# Zainstaluj APK
adb install mobile-build/timeriq-debug.apk
```

## Alternatywna metoda - Bez APK (Development)

Jeśli nie chcesz instalować całego Android SDK, możesz używać aplikacji w trybie developerskim:

```bash
# 1. Uruchom serwer Next.js
npm run dev

# 2. Otwórz na telefonie przeglądarką
# Znajdź swój adres IP: ifconfig | grep "inet "
# Otwórz: http://[TWOJ_IP]:3000
```

## Pliki w tym folderze

- `README.md` - Pełna dokumentacja budowania APK
- `QUICKSTART.md` - Ten plik (szybki start)
- `install-requirements.sh` - Automatyczna instalacja Android SDK
- `build-apk.sh` - Skrypt budowania APK
- `android-env.sh` - Zmienne środowiskowe

## Rozwiązywanie problemów

### "ANDROID_HOME not set"
```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
source ~/.zshrc
```

### "Java not found"
```bash
brew install openjdk@17
```

### Gradlew permission denied
```bash
cd android
chmod +x gradlew
```

## Co dalej?

Po zbudowaniu APK:
1. APK znajdziesz w `mobile-build/timeriq-debug.apk`
2. Skopiuj na telefon i zainstaluj
3. Lub użyj `adb install` aby zainstalować przez USB

## Uwagi

- APK w trybie debug wymaga działającego serwera Next.js (localhost:3000)
- Dla wersji produkcyjnej, wdróż backend i zaktualizuj `capacitor.config.ts`
- Aplikacja wymaga połączenia z Supabase (sprawdź .env.local)
