# Build troubleshooting

## Gradle looks for an old JDK

Check JAVA_HOME and java -version. Also check android/gradle.properties and %USERPROFILE%\.gradle\gradle.properties for org.gradle.java.home pointing to a removed JDK; update or remove that setting.

To stop old Gradle daemons, run this from the project root:

    .\android\gradlew.bat --stop
    npm.cmd run android:build

## Invalid Android path error

Check ANDROID_HOME and ANDROID_USER_HOME with Get-ChildItem Env:ANDROID*. Remove leading or trailing spaces. A path like “ C:\Users\...” (with a space before C:) is invalid. On Windows, ANDROID_USER_HOME is usually %USERPROFILE%\.android.

The local android/local.properties file, when present, can set the SDK path with a line such as sdk.dir=C:/Users/&lt;user&gt;/AppData/Local/Android/Sdk. This file is ignored by Git because the path is machine-specific; update it if your SDK is somewhere else.

## Get the full Gradle error

If the build fails, run Gradle with --stacktrace from the android/ folder:

    cd android
    .\gradlew.bat assembleDebug --stacktrace
    cd ..

Read the final lines starting with Caused by:; they usually show the specific cause and the path involved. Use cd .. to return to the project root.

## What does UP-TO-DATE mean?

It means Gradle did not need to repeat a task because its inputs had not changed. android:build syncs the web files before Gradle runs; run it from the project root and check the modification time of android\app\build\outputs\apk\debug\app-debug.apk.
