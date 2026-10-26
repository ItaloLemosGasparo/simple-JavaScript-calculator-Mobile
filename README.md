# Simple Calculator Mobile

Calculadora responsiva feita com HTML, CSS e JavaScript. Pode ser aberta no navegador ou empacotada como aplicativo Android usando Capacitor.

## Recursos

- Adição, subtração, multiplicação, divisão, decimais, porcentagens e parênteses.
- Prévia do resultado enquanto a expressão é digitada.
- Multiplicação implícita: 2(3 + 4) resulta em 14.
- Temas claro e escuro, teclado físico, limpar, apagar e trocar o sinal.
- Parser aritmético próprio; as expressões não são executadas como JavaScript.

## Testar no navegador

Abra o PowerShell na pasta do projeto e inicie um servidor:

    python -m http.server 8000 --bind 0.0.0.0

Abra http://localhost:8000 no computador. Para testar em um celular na mesma rede Wi-Fi, use http://&lt;IP-do-computador&gt;:8000. Esse servidor é apenas para testar no navegador; não é usado para compilar o APK.

## Requisitos para compilar no Windows

- Node.js e npm.
- JDK 17 ou superior. O projeto usa Android Gradle Plugin 8.7.2 e Gradle 8.11.1; JDK 21 também funciona.
- Android SDK instalado, incluindo a plataforma Android 35 e as ferramentas de build correspondentes.
- Licenças do Android SDK aceitas e acesso à internet para baixar dependências na primeira compilação.

Confira Java e as variáveis Android no mesmo PowerShell em que fará o build:

    java -version
    Test-Path "$env:JAVA_HOME\bin\java.exe"
    Get-ChildItem Env:ANDROID* | Format-Table Name, Value -AutoSize

JAVA_HOME deve apontar para a pasta raiz do JDK, por exemplo C:\Program Files\Eclipse Adoptium\jdk-21...; não deve terminar em \bin. ANDROID_HOME deve apontar para o SDK, normalmente C:\Users\&lt;usuário&gt;\AppData\Local\Android\Sdk. ANDROID_USER_HOME, se definido, normalmente aponta para C:\Users\&lt;usuário&gt;\.android. Confira se os valores não têm espaços no início ou no fim.

Se o PowerShell bloquear npm por causa da política local de scripts, use npm.cmd como nos exemplos. Não é preciso alterar a política do Windows.

## Preparar o projeto pela primeira vez

Abra o PowerShell na pasta raiz deste projeto, que contém package.json, e instale as dependências:

    npm.cmd install

A pasta android/ já existe neste repositório. Se ela existir no seu checkout, pule android:add e vá para **Gerar ou atualizar o APK**. android:add só é necessário para criar o projeto nativo Android quando a pasta android/ ainda não existe:

    npm.cmd run android:add

Esse comando prepara os arquivos web em www/ e cria a estrutura Android pelo Capacitor. Normalmente é executado uma vez por checkout.

## Gerar ou atualizar o APK

Sempre execute o comando a partir da pasta raiz do projeto:

    npm.cmd run android:build

O comando executa duas etapas:

1. android:sync prepara os arquivos atuais index.html, style.css e script.js em www/ e sincroniza esses arquivos com o projeto Android pelo Capacitor.
2. O Gradle executa assembleDebug e gera o APK de depuração.

Depois de alterar HTML, CSS ou JavaScript, basta executar android:build; não é necessário executar android:sync separadamente. A sincronização copia o conteúdo web novo para o app Android. O Gradle sozinho compila os arquivos que já estão no projeto nativo.

O APK fica em:

    android\app\build\outputs\apk\debug\app-debug.apk

Para instalar ou substituir a versão no celular conectado com depuração USB habilitada:

    adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk

O argumento -r pede ao Android para substituir uma instalação existente do mesmo aplicativo. O APK debug serve para desenvolvimento e testes; para distribuir o app, é necessário configurar assinatura e gerar um build release.

## Comandos disponíveis

Execute-os a partir da pasta raiz:

| Comando | O que faz |
| --- | --- |
| &#96;npm.cmd run build:web&#96; | Copia os arquivos web para www/. |
| &#96;npm.cmd run android:sync&#96; | Prepara www/ e sincroniza com o Android, sem compilar o APK. |
| &#96;npm.cmd run android:build&#96; | Sincroniza os arquivos web e compila o APK debug. Use este para obter um APK atualizado. |
| &#96;npm.cmd test&#96; | Executa os testes Node.js disponíveis no projeto. |

## Solução de problemas

### Gradle procura um JDK antigo

Confira JAVA_HOME e java -version. Verifique também android/gradle.properties e %USERPROFILE%\.gradle\gradle.properties em busca de org.gradle.java.home apontando para um JDK removido; atualize ou remova essa configuração.

Para encerrar daemons antigos do Gradle, execute na raiz:

    .\android\gradlew.bat --stop
    npm.cmd run android:build

### Erro de caminho Android inválido

Confira ANDROID_HOME e ANDROID_USER_HOME com Get-ChildItem Env:ANDROID*. Remova espaços no início ou no fim dos valores. Um caminho como “ C:\Users\...” (com espaço antes de C:) é inválido. No Windows, ANDROID_USER_HOME normalmente é %USERPROFILE%\.android.

O arquivo local android/local.properties, quando presente, pode definir o SDK com uma linha como sdk.dir=C:/Users/&lt;usuário&gt;/AppData/Local/Android/Sdk. Esse arquivo é ignorado pelo Git porque o caminho depende do computador; ajuste-o se o SDK estiver em outro lugar.

### Ver o erro completo do Gradle

Se o build falhar, rode o Gradle com --stacktrace a partir da pasta android/:

    cd android
    .\gradlew.bat assembleDebug --stacktrace
    cd ..

Leia as linhas finais que começam com Caused by:; elas normalmente mostram a causa específica e o caminho envolvido. cd .. volta à pasta raiz.

### O que significa UP-TO-DATE?

Significa que o Gradle não precisou repetir uma tarefa porque as entradas dela não mudaram. android:build sincroniza os arquivos web antes da compilação; execute-o a partir da raiz e confira a data de android\app\build\outputs\apk\debug\app-debug.apk. Se o celular continuar mostrando a versão anterior, instale o APK novamente com adb install -r.

## Testes

Execute:

    npm.cmd test

Atualmente não há testes automatizados implementados. Ao alterar a calculadora, confira manualmente operações básicas, decimais, porcentagens, parênteses, multiplicação implícita, teclado físico e expansão/recolhimento de **More functions**.

## Estrutura do projeto

- index.html: estrutura da página e regiões acessíveis da calculadora.
- style.css: layout responsivo, teclas, temas e preferências de movimento.
- script.js: teclado, entrada, prévia e parser aritmético.
- scripts/build-web.mjs: recria www/ com os arquivos web da raiz.
- www/: conteúdo web preparado para o Capacitor; é recriado durante a sincronização.
- capacitor.config.json: nome, identificador e diretório web do aplicativo.
- android/: projeto Android nativo e configuração do Gradle.

## Comportamento da calculadora

- Divisão por zero é exibida como resultado indefinido.
- 25% equivale a 0,25; em multiplicação, 200 * 10% resulta em 20.
- Em soma e subtração, a porcentagem é aplicada ao valor acumulado: 100 + 100% resulta em 200 e 100 - 10% resulta em 90.
- O identificador Android do app é com.simplecalc.mobile.
- simple-JavaScript-calculator V2 é outra versão. Faça as alterações desta versão Mobile somente neste projeto.

---

# Simple Calculator Mobile (English)

A responsive calculator built with HTML, CSS, and JavaScript. It can run in a browser or be packaged as an Android app with Capacitor.

## Features

- Addition, subtraction, multiplication, division, decimals, percentages, and parentheses.
- Live result preview as you type.
- Implicit multiplication: 2(3 + 4) evaluates to 14.
- Light and dark themes, physical keyboard support, clear, delete, and change-sign buttons.
- A custom arithmetic parser; expressions are not executed as JavaScript.

## Try it in a browser

Open PowerShell in the project folder and start a local server:

    python -m http.server 8000 --bind 0.0.0.0

Open http://localhost:8000 on your computer. To test on a phone on the same Wi-Fi network, use http://&lt;computer-IP&gt;:8000. This server is only for browser testing; it is not used to build the APK.

## Windows build requirements

- Node.js and npm.
- JDK 17 or newer. This project uses Android Gradle Plugin 8.7.2 and Gradle 8.11.1; JDK 21 also works.
- Android SDK, including Android platform 35 and the matching build tools.
- Accepted Android SDK licenses and internet access to download dependencies on the first build.

Check Java and the Android variables in the same PowerShell window you will use for the build:

    java -version
    Test-Path "$env:JAVA_HOME\bin\java.exe"
    Get-ChildItem Env:ANDROID* | Format-Table Name, Value -AutoSize

JAVA_HOME must point to the JDK root folder, for example C:\Program Files\Eclipse Adoptium\jdk-21...; it must not end in \bin. ANDROID_HOME must point to the SDK folder, usually C:\Users\&lt;user&gt;\AppData\Local\Android\Sdk. If set, ANDROID_USER_HOME usually points to C:\Users\&lt;user&gt;\.android. Make sure these values have no leading or trailing spaces.

If PowerShell blocks npm due to the local script execution policy, use npm.cmd as shown below. You do not need to change the Windows execution policy.

## First-time project setup

Open PowerShell in the project root (the folder containing package.json) and install dependencies:

    npm.cmd install

The android/ folder is already included in this repository. If it exists in your checkout, skip android:add and go to **Build or update the APK**. android:add is only needed to create the native Android project when the android/ folder is missing:

    npm.cmd run android:add

This command prepares the web files in www/ and creates the native Android structure with Capacitor. It is normally run once per checkout.

## Build or update the APK

Always run this command from the project root:

    npm.cmd run android:build

The command runs two steps:

1. android:sync prepares the current index.html, style.css, and script.js files in www/, then syncs them into the Android project through Capacitor.
2. Gradle runs assembleDebug and creates the debug APK.

After changing HTML, CSS, or JavaScript, run android:build; you do not need to run android:sync separately. Sync copies updated web content into the Android app. Gradle alone only compiles the files already in the native project.

The APK is written to:

    android\app\build\outputs\apk\debug\app-debug.apk

To install or replace the app on a connected phone with USB debugging enabled:

    adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk

The -r option tells Android to replace an existing installation of the same app. The debug APK is for development and testing; distribution requires configuring signing and creating a release build.

## Available commands

Run these from the project root:

| Command | What it does |
| --- | --- |
| &#96;npm.cmd run build:web&#96; | Copies the web files into www/. |
| &#96;npm.cmd run android:sync&#96; | Prepares www/ and syncs the files into Android, without building an APK. |
| &#96;npm.cmd run android:build&#96; | Syncs the web files and builds the debug APK. Use this to get an up-to-date APK. |
| &#96;npm.cmd test&#96; | Runs the Node.js tests available in the project. |

## Build troubleshooting

### Gradle looks for an old JDK

Check JAVA_HOME and java -version. Also check android/gradle.properties and %USERPROFILE%\.gradle\gradle.properties for org.gradle.java.home pointing to a removed JDK; update or remove that setting.

To stop old Gradle daemons, run this from the project root:

    .\android\gradlew.bat --stop
    npm.cmd run android:build

### Invalid Android path error

Check ANDROID_HOME and ANDROID_USER_HOME with Get-ChildItem Env:ANDROID*. Remove leading or trailing spaces. A path like “ C:\Users\...” (with a space before C:) is invalid. On Windows, ANDROID_USER_HOME is usually %USERPROFILE%\.android.

The local android/local.properties file, when present, can set the SDK path with a line such as sdk.dir=C:/Users/&lt;user&gt;/AppData/Local/Android/Sdk. This file is ignored by Git because the path is machine-specific; update it if your SDK is somewhere else.

### Get the full Gradle error

If the build fails, run Gradle with --stacktrace from the android/ folder:

    cd android
    .\gradlew.bat assembleDebug --stacktrace
    cd ..

Read the final lines starting with Caused by:; they usually show the specific cause and the path involved. Use cd .. to return to the project root.

### What does UP-TO-DATE mean?

It means Gradle did not need to repeat a task because its inputs had not changed. android:build syncs the web files before Gradle runs; run it from the project root and check the modification time of android\app\build\outputs\apk\debug\app-debug.apk. If the phone still shows the previous version, install the APK again with adb install -r.

## Tests

Run:

    npm.cmd test

There are currently no automated tests implemented. When changing calculator behavior, manually check basic operations, decimals, percentages, parentheses, implicit multiplication, physical keyboard input, and expanding/collapsing **More functions**.

## Project structure

- index.html: page structure and accessible calculator regions.
- style.css: responsive layout, keys, themes, and motion preferences.
- script.js: keypad, input, preview, and arithmetic parser.
- scripts/build-web.mjs: recreates www/ from the web files in the project root.
- www/: web content prepared for Capacitor; recreated during sync.
- capacitor.config.json: app name, identifier, and web directory.
- android/: native Android project and Gradle configuration.

## Calculator behavior

- Division by zero is shown as an undefined result.
- 25% is equivalent to 0.25; for multiplication, 200 * 10% evaluates to 20.
- For addition and subtraction, the percentage is applied to the running total: 100 + 100% evaluates to 200, and 100 - 10% evaluates to 90.
- The Android application ID is com.simplecalc.mobile.
- simple-JavaScript-calculator V2 is a separate version; make changes for this Mobile version in this project only.