# Claude Code PT→EN Translator

Extensão VSCode que intercepta prompts em português digitados no Claude Code e os traduz automaticamente para inglês antes de enviar — **sem interromper o fluxo de trabalho**.

---

## Como funciona

```
Você digita em PT  →  [Enter]  →  Detecção automática  →  LibreTranslate  →  Claude Code recebe em EN
```

A extensão injeta uma **função bash** no seu `.bashrc` / `.zshrc` que sobrescreve o comando `claude`. Quando você aperta Enter num input em português, a função:

1. Detecta o idioma (heurística rápida, sem chamada de API)
2. Se for PT → chama o LibreTranslate para traduzir
3. Exibe a tradução em cinza no terminal (modo preview)
4. Envia o texto traduzido para o Claude Code

---

## Instalação

### 1. Instalar o LibreTranslate (local — grátis, sem limites)

```bash
pip install libretranslate
libretranslate --load-only pt,en
```

Ou via Docker:

```bash
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate --load-only pt,en
```

O servidor sobe em `http://localhost:5000`.

### 2. Instalar a extensão

**Opção A — Via VSIX (recomendado)**

```bash
cd claude-pt-translator
npm install
npm run compile
npx vsce package          # gera claude-pt-translator-1.0.0.vsix
code --install-extension claude-pt-translator-1.0.0.vsix
```

**Opção B — Desenvolvimento direto**

```bash
cd claude-pt-translator
npm install
npm run compile
# Abra a pasta no VSCode e pressione F5
```

### 3. Configurar URL do LibreTranslate

Abra a paleta de comandos (`Ctrl+Shift+P`) e execute:

```
Claude PT→EN: Set LibreTranslate URL
```

- **Servidor local:**  `http://localhost:5000`
- **Servidor público:** `https://libretranslate.com` (requer API key)

### 4. Reabrir o terminal

Abra um novo terminal integrado no VSCode (`Ctrl+\``) e execute:

```bash
claude
```

A partir daí, qualquer prompt em português será traduzido automaticamente!

---

## Uso

```
claude❯ cria um componente React de login com validação de email
  [PT→EN] create a React login component with email validation
```

O texto em cinza mostra a tradução antes de ser enviada.

---

## Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `Claude PT→EN: Enable Translator` | Ativa a tradução |
| `Claude PT→EN: Disable Translator` | Desativa e remove o hook do shell |
| `Claude PT→EN: Set LibreTranslate URL` | Configura o servidor |
| `Claude PT→EN: Translate Selected Text` | Traduz texto selecionado no editor (`Ctrl+Shift+T`) |

---

## Configurações (`settings.json`)

```json
{
  "claudePtTranslator.enabled": true,
  "claudePtTranslator.libreTranslateUrl": "http://localhost:5000",
  "claudePtTranslator.libreTranslateApiKey": "",
  "claudePtTranslator.showNotification": true
}
```

---

## Barra de status

No canto inferior direito do VSCode aparece:

- **`$(globe) PT→EN: ON`** — tradução ativa (fundo amarelo)
- **`$(globe) PT→EN: OFF`** — tradução desativada

Clique para alternar.

---

## Usando o LibreTranslate público

Se não quiser rodar localmente, use `https://libretranslate.com` e registre uma API key gratuita em [libretranslate.com](https://libretranslate.com). Configure em:

```json
{
  "claudePtTranslator.libreTranslateUrl": "https://libretranslate.com",
  "claudePtTranslator.libreTranslateApiKey": "SUA_CHAVE_AQUI"
}
```

---

## Desinstalar

```
Ctrl+Shift+P → Claude PT→EN: Disable Translator
```

Isso remove o hook do `.bashrc` / `.zshrc`. Depois desinstale a extensão normalmente pelo VSCode.
