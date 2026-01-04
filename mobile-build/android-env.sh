# Konfiguracja środowiska dla budowania Android APK

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/tools:$PATH
export PATH=$ANDROID_HOME/tools/bin:$PATH

# Java (dla Gradle)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Weryfikacja
echo "Weryfikacja środowiska Android:"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "Java version:"
java -version
echo ""
echo "Android SDK tools:"
which sdkmanager
echo ""
echo "ADB:"
which adb
