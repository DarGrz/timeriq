# TimerIQ - Budowanie APK dla Android

Ten folder zawiera instrukcje i skrypty do budowania aplikacji mobilnej Android (APK).

## Wymagania

1. **Node.js i npm** - już zainstalowane
2. **Android Studio** lub **Android SDK Command-line Tools**
3. **Java JDK 17** (wymagane przez Android Gradle)

## Instalacja Android SDK (macOS)

### Opcja 1: Przez Homebrew (zalecane)
```bash
# Zainstaluj Java JDK
brew install openjdk@17

# Dodaj Java do PATH (dodaj do ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Zainstaluj Android Command Line Tools
brew install --cask android-commandlinetools

# Ustaw zmienne środowiskowe (dodaj do ~/.zshrc)
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH' >> ~/.zshrc
echo 'export PATH=$ANDROID_HOME/platform-tools:$PATH' >> ~/.zshrc
source ~/.zshrc

# Zainstaluj wymagane komponenty SDK
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
sdkmanager --licenses
```

### Opcja 2: Przez Android Studio
1. Pobierz i zainstaluj Android Studio: https://developer.android.com/studio
2. Otwórz Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
3. Zainstaluj:
   - Android SDK Platform 33
   - Android SDK Build-Tools 33.0.0
4. Dodaj do ~/.zshrc:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
```

## Budowanie APK

### Metoda 1: APK z lokalnym serwerem (Development)

Ta metoda tworzy APK, które łączy się z lokalnym serwerem Next.js.

```bash
# 1. Przejdź do głównego katalogu projektu
cd /Users/dargrz/timeriq

# 2. Uruchom serwer Next.js w tle
npm run dev

# 3. W nowym terminalu, zsynchronizuj pliki
npx cap sync android

# 4. Zbuduj APK przez Capacitor
cd android
./gradlew assembleDebug

# APK znajdziesz w: android/app/build/outputs/apk/debug/app-debug.apk
```

### Metoda 2: APK produkcyjny (wymaga backendu)

Dla w pełni działającej aplikacji produkcyjnej:

```bash
# 1. Zaktualizuj capacitor.config.ts z URL produkcyjnym
# Zmień server.url na URL twojego wdrożonego backendu

# 2. Zsynchronizuj
npx cap sync android

# 3. Zbuduj release APK
cd android
./gradlew assembleRelease

# APK znajdziesz w: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Metoda 3: Szybki build (używając tego skryptu)

```bash
# Uruchom skrypt budowania
bash mobile-build/build-apk.sh
```

## Podpisywanie APK (dla wersji release)

```bash
# Wygeneruj keystore
keytool -genkey -v -keystore timeriq-release.keystore -alias timeriq -keyalg RSA -keysize 2048 -validity 10000

# Podpisz APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore timeriq-release.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk timeriq

# Zoptymalizuj APK
zipalign -v 4 android/app/build/outputs/apk/release/app-release-unsigned.apk timeriq-release.apk
```

## Testowanie APK

```bash
# Zainstaluj ADB jeśli nie masz
brew install android-platform-tools

# Podłącz urządzenie Android lub uruchom emulator
# Sprawdź czy urządzenie jest widoczne
adb devices

# Zainstaluj APK na urządzeniu
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Rozwiązywanie problemów

### Błąd "ANDROID_HOME not set"
```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
source ~/.zshrc
```

### Błąd "Java not found"
```bash
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Błąd gradlew permission denied
```bash
cd android
chmod +x gradlew
```

## Struktura projektu Android

Po wykonaniu `npx cap add android`, utworzony zostanie folder:
```
android/
├── app/
│   ├── src/
│   └── build.gradle
├── gradle/
├── gradlew
└── build.gradle
```

## Następne kroki

1. Zainstaluj wymagania (Android SDK, Java)
2. Uruchom `bash mobile-build/build-apk.sh`
3. Znajdź APK w `android/app/build/outputs/apk/debug/`
4. Zainstaluj na urządzeniu Android
