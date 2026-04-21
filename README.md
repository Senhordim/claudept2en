# claudept2en

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
cd claudept2en
npm install
npm run compile
npx vsce package          # gera claudept2en-1.0.0.vsix
code --install-extension claudept2en-1.0.0.vsix
```

**Opção B — Desenvolvimento direto**

```bash
cd claudept2en
npm install
npm run compile
# Abra a pasta no VSCode e pressione F5
```

### 3. Configurar URL do LibreTranslate

Abra a paleta de comandos (`Ctrl+Shift+P`) e execute:

```
claudept2en: Set LibreTranslate URL
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
| `claudept2en: Enable Translator` | Ativa a tradução |
| `claudept2en: Disable Translator` | Desativa e remove o hook do shell |
| `claudept2en: Set LibreTranslate URL` | Configura o servidor |
| `claudept2en: Translate Selected Text` | Traduz texto selecionado no editor (`Ctrl+Shift+T`) |

---

## Configurações (`settings.json`)

```json
{
  "claudePt2En.enabled": true,
  "claudePt2En.libreTranslateUrl": "http://localhost:5000",
  "claudePt2En.libreTranslateApiKey": "",
  "claudePt2En.showNotification": true
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
  "claudePt2En.libreTranslateUrl": "https://libretranslate.com",
  "claudePt2En.libreTranslateApiKey": "SUA_CHAVE_AQUI"
}
```

---

## Desinstalar

```
Ctrl+Shift+P → claudept2en: Disable Translator
```

Isso remove o hook do `.bashrc` / `.zshrc`. Depois desinstale a extensão normalmente pelo VSCode.

---

## 🤝 Como contribuir

Este projeto é open-source! Se você encontrou um bug, tem uma ideia para uma nova funcionalidade ou quer melhorar o código/documentação, toda contribuição é muito bem-vinda.

### Passos para contribuir:

1. Faça um **Fork** do projeto
2. Crie uma branch para sua modificação (`git checkout -b feature/minha-nova-funcionalidade`)
3. Faça o commit de suas alterações (`git commit -m 'Adiciona minha nova funcionalidade'`)
4. Faça o push para a branch (`git push origin feature/minha-nova-funcionalidade`)
5. Abra um **Pull Request**

Se tiver dúvidas ou encontrar algum problema, sinta-se à vontade para abrir uma **Issue**.
