# Simple Calculator Mobile

Calculadora responsiva feita com HTML, CSS e JavaScript. A interface foi adaptada para celulares e pode ser aberta no navegador ou empacotada como aplicativo Android usando Capacitor.

## Recursos

- Adição, subtração, multiplicação, divisão, números decimais e porcentagens.
- Prévia do resultado enquanto a expressão é digitada.
- Parênteses opcionais pelo botão **More functions**.
- Multiplicação implícita entre um número e um parêntese. Por exemplo, `2(3 + 4)` resulta em `14`.
- Botões para limpar, apagar o último caractere e trocar o sinal.
- Temas claro e escuro.
- Teclado físico: números, `.`, `+`, `-`, `*`, `/`, `%`, `(` e `)`; Enter ou `=` calcula; Backspace apaga; Escape ou `C` limpa.
- Layout de tela cheia, áreas seguras para recortes do aparelho e ajustes para telas baixas ou orientação paisagem.
- Parser aritmético próprio; as expressões não são executadas como JavaScript.

## Abrir no navegador

Abra `index.html` em um navegador moderno. Para testar em um celular conectado à mesma rede Wi-Fi, inicie um servidor local na pasta do projeto:

```powershell
python -m http.server 8000 --bind 0.0.0.0
```

Descubra o endereço IP local do computador e abra `http://<IP-do-computador>:8000` no celular. Esse servidor é apenas para testar no navegador; não é necessário para compilar o APK.

## Requisitos para compilar o APK Android

- Node.js e npm.
- JDK 21. O Android Gradle Plugin usado pelo projeto exige Java 21 para compilar Capacitor. Confirme a versão no mesmo terminal que será usado para o build:

  ```powershell
  java -version
  ```

- Android SDK instalado, com as licenças aceitas. `ANDROID_HOME` deve apontar para a pasta do SDK, normalmente `$env:LOCALAPPDATA\Android\Sdk` no Windows.
- Acesso à internet para baixar dependências npm e componentes Android/Gradle necessários.

No PowerShell, use `npm.cmd` caso o comando `npm` seja bloqueado pela política local de scripts.

## Preparar o projeto Android pela primeira vez

Abra o PowerShell na pasta `simple-JavaScript-calculator Mobile` e execute:

```powershell
npm.cmd install
npm.cmd run android:add
```

`android:add` prepara os arquivos web em `www/` e cria o projeto nativo dentro de `android/`. Essa etapa só precisa ser feita uma vez por checkout, desde que a pasta `android/` seja mantida.

## Compilar o APK de depuração

Depois da preparação inicial, execute:

```powershell
npm.cmd run android:build
```

O APK gerado fica em:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Esse é um APK de depuração para instalação e testes. Para distribuir uma versão de lançamento, é necessário configurar assinatura Android e gerar um build release.

## Atualizar o app após mudar HTML, CSS ou JavaScript

Sincronize os arquivos web atualizados com o projeto Android e compile novamente:

```powershell
npm.cmd run android:sync
npm.cmd run android:build
```

O comando `android:sync` também executa a preparação de `www/` antes de sincronizar com Capacitor.

## Testes

Execute os testes automatizados disponíveis com:

```powershell
npm.cmd test
```

Atualmente não há testes automatizados implementados; o comando pode concluir com zero testes. Ao alterar o comportamento da calculadora, confira manualmente operações básicas, decimais, porcentagens, parênteses aninhados, multiplicação implícita, teclado físico e expansão/recolhimento de **More functions**.

## Estrutura do projeto

- `index.html`: estrutura da página e regiões acessíveis da calculadora.
- `style.css`: layout responsivo, teclas, temas e preferências de movimento.
- `script.js`: criação do teclado, entrada, prévia e parser aritmético.
- `scripts/build-web.mjs`: copia os arquivos da calculadora para `www/`.
- `www/`: conteúdo web empacotado pelo Capacitor; é recriado pelo script de preparação.
- `capacitor.config.json`: identificador, nome e diretório web do aplicativo Android.
- `android/`: projeto Android nativo gerado pelo Capacitor.

## Observações

- Divisão por zero é exibida como resultado indefinido.
- A porcentagem é um operador pós-fixado: `25%` equivale a `0,25`; portanto `200 * 10%` resulta em `20`.
- O projeto Android usa o identificador `com.simplecalc.mobile`.
- A pasta `simple-JavaScript-calculator V2` é uma versão separada. Faça as alterações desta versão Mobile somente nesta pasta.
test