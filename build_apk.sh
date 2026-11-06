#!/usr/bin/env bash
# Сборка APK без Android Studio. Нужно: aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 (apt, Ubuntu/Debian)
set -euo pipefail
cd "$(dirname "$0")"
JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
OUT=build; rm -rf $OUT; mkdir -p $OUT/gen $OUT/classes $OUT/assets
cp -r www $OUT/assets/www
aapt package -f -m -J $OUT/gen -M android/AndroidManifest.xml -S android/res -I $JAR
javac -nowarn --release 8 -classpath $JAR -d $OUT/classes $(find $OUT/gen android/src -name '*.java')
dalvik-exchange --dex --output=$OUT/classes.dex $OUT/classes
aapt package -f -M android/AndroidManifest.xml -S android/res -A $OUT/assets -0 arsc -I $JAR -F $OUT/unsigned.apk
(cd $OUT && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 $OUT/unsigned.apk $OUT/aligned.apk
KS=${KEYSTORE:-android/release.keystore}
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -alias obyavka -keyalg RSA -keysize 2048 -validity 36500 -storepass obyavka -keypass obyavka -dname "CN=Obyavka" >/dev/null
apksigner sign --ks "$KS" --ks-pass pass:${KS_PASS:-obyavka} --out ${1:-Obyavka.apk} $OUT/aligned.apk
apksigner verify ${1:-Obyavka.apk} && echo "OK: ${1:-Obyavka.apk}"
