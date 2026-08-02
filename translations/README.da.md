<p align="center">
  <a href="../README.md">English</a> | <a href="README.zh.md">简体中文</a> | <a href="README.zht.md">繁體中文</a> | <a href="README.ko.md">한국어</a> | <a href="README.de.md">Deutsch</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.it.md">Italiano</a> | Dansk | <a href="README.ja.md">日本語</a> | <a href="README.pl.md">Polski</a> | <a href="README.ru.md">Русский</a> | <a href="README.bs.md">Bosanski</a> | <a href="README.ar.md">العربية</a> | <a href="README.no.md">Norsk</a> | <a href="README.br.md">Português (Brasil)</a> | <a href="README.th.md">ไทย</a> | <a href="README.tr.md">Türkçe</a> | <a href="README.uk.md">Українська</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.gr.md">Ελληνικά</a> | <a href="README.vi.md">Tiếng Việt</a>
</p>

<p align="center">
  <a href="https://neo.khulnasoft.com"><img width="250" alt="Neo Code logo" src="https://github.com/user-attachments/assets/bdb0c174-b9fd-40ad-a47b-f3aab9b54e8d" /></a>
</p>

<p align="center">Den open source-kodeagent til at bygge med AI i VS Code, JetBrains eller CLI.</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=neocode.Neo-Code"><img src="https://raster.shields.io/badge/VS_Code_Marketplace-007ACC?style=flat&logo=visualstudiocode&logoColor=white" alt="VS Code Marketplace" height="20"></a>
  <a href="https://www.npmjs.com/package/@neocode/cli"><img alt="npm" src="https://raster.shields.io/npm/v/@neocode/cli?style=flat" height="20" /></a>
  <a href="https://x.com/neocode"><img src="https://raster.shields.io/badge/neocode-000000?style=flat&logo=x&logoColor=white" alt="X (Twitter)" height="20"></a>
  <a href="https://blog.neo.khulnasoft.com"><img src="https://raster.shields.io/badge/Blog-555?style=flat&logo=substack&logoColor=white" alt="Blog" height="20"></a>
  <a href="https://neo.khulnasoft.com/discord"><img src="https://raster.shields.io/badge/Join%20Discord-5865F2?style=flat&logo=discord&logoColor=white" alt="Discord" height="20"></a>
  <a href="https://www.reddit.com/r/neocode/"><img src="https://raster.shields.io/badge/Join%20r%2Fneocode-D84315?style=flat&logo=reddit&logoColor=white" alt="Reddit" height="20"></a>
</p>

![Neo-in-VS-Code-and-CLI](https://github.com/user-attachments/assets/0536ca59-ed81-4512-9e05-d186187a1b52)

---

Neo Code er en AI-kodeagent, der møder dig overalt, hvor du arbejder: [VS Code](https://neo.khulnasoft.com/landing/vs-code), [JetBrains](https://neo.khulnasoft.com/features/jetbrains-native) og [CLI](https://neo.khulnasoft.com/cli). Den er open source med åben prissætning. Du vælger mellem mere end 500 modeller, skifter mellem dem midt i en opgave og betaler modeludbyderens pris uden tillæg. Ingen API-nøgler kræves for at komme i gang.

### Installation

Vælg, hvor du vil køre Neo.

<details open>
<summary><strong>VS Code</strong></summary>

<br>

Installer [Neo Code-udvidelsen](vscode:extension/neocode.neo-code) direkte, eller hent den fra [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=neocode.Neo-Code). Opret en konto, og du får adgang til mere end 500 modeller, herunder GPT-5.5, Claude Opus 4.7, Claude Sonnet 4.6 og Gemini 3.1 Pro Preview, alle til udbyderpris.

</details>

<details open>
<summary><strong>CLI</strong></summary>

<br>

```bash
# npm
npm install -g @neocode/cli

# curl
curl -fsSL https://neo.khulnasoft.com/cli/install | bash

# pnpm
pnpm add -g @neocode/cli

# bun
bun add -g @neocode/cli

# Homebrew (macOS / Linux)
brew install Neopilot-Ai/tap/neo

# Arch Linux (AUR)
paru -S neo-bin
```

Kør derefter `neo` i en vilkårlig projektmappe for at starte.

</details>

<details>
<summary><strong>JetBrains</strong></summary>

<br>

Installer [Neo Code-pluginet](https://plugins.jetbrains.com/plugin/28350-neo-code) fra JetBrains Marketplace, eller søg efter "Neo Code" i `Settings → Plugins` i en JetBrains IDE.

</details>

<details>
<summary><strong>Cloud Agent</strong></summary>

<br>

Kør Neo fra webben, uden lokal maskine, på [app.neo.khulnasoft.com/cloud](https://app.neo.khulnasoft.com/cloud).

</details>

<details>
<summary><strong>Kodegennemgange</strong></summary>

<br>

Opsæt automatiske AI-kodegennemgange på dine pull requests på [app.neo.khulnasoft.com/code-reviews](https://app.neo.khulnasoft.com/code-reviews).

</details>

<details>
<summary><strong>NeoClaw</strong></summary>

<br>

Start din altid aktive AI-agent på [app.neo.khulnasoft.com/claw](https://app.neo.khulnasoft.com/claw).

</details>

<details>
<summary>Installer CLI fra GitHub Releases (binære filer)</summary>

Download den nyeste binære fil fra [Releases-siden](https://github.com/Neopilot-Ai/neocode/releases).

| Platform | Asset |
|---|---|
| Windows (de fleste pc'er) | `neo-windows-x64.zip` |
| macOS (Apple Silicon) | `neo-darwin-arm64.zip` |
| macOS (Intel) | `neo-darwin-x64.zip` |
| Linux x64 | `neo-linux-x64.tar.gz` |
| Linux ARM | `neo-linux-arm64.tar.gz` |

Bemærk: `x64-baseline` er en kompatibilitetsbuild til ældre CPU'er uden AVX. `musl` er den statisk linkede build til Alpine eller minimale Docker-images uden glibc. `neo-vscode-*.vsix` er VS Code-udvidelsespakken, ikke CLI'en. `Source code`-arkiver er til at bygge fra kildekode.

</details>

### Agents

Neo leveres med specialiserede agents, som du kan skifte mellem afhængigt af opgaven. Du kan også bygge dine egne brugerdefinerede agents.

- **Code** - Standard. Implementerer og redigerer kode fra naturligt sprog.
- **Plan** - Designer arkitektur og skriver implementeringsplaner, før der skrives kode.
- **Ask** - Besvarer spørgsmål om din kodebase uden at ændre filer.
- **Debug** - Fejlfinder og sporer problemer.
- **Review** - Gennemgår dine ændringer og finder problemer med ydeevne, sikkerhed, stil og testdækning.

Læs mere om [agents og brugerdefinerede agents](https://neo.khulnasoft.com/docs/code-with-ai/agents/using-agents).

### Hvad den gør

- **Kodegenerering** fra naturligt sprog på tværs af flere filer.
- **Inline-autocomplete** med ghost-text-forslag og Tab for at acceptere.
- **Selvkontrol**, så agenten gennemgår og retter sit eget arbejde.
- **Terminal- og browserkontrol** til at køre kommandoer og automatisere webben.
- **MCP-markedsplads** til at finde og tilslutte MCP-servere, der udvider agentens muligheder.
- **Mere end 500 modeller** med skift midt i opgaven, så du kan matche latenstid, pris og ræsonnement til arbejdet.

### Autonom tilstand (CI/CD)

Kør `neo run` med `--auto` for fuldt autonom drift uden prompts, bygget til CI/CD-pipelines:

```bash
neo run --auto "run tests and fix any failures"
```

`--auto` deaktiverer alle tilladelsesprompts og lader agenten udføre enhver handling uden bekræftelse. Brug det kun i betroede miljøer.

### Dokumentation

For konfiguration og alt andet, se [dokumentationen](https://neo.khulnasoft.com/docs).

### Bidrag

Bidrag er velkomne fra udviklere, forfattere og alle andre. Start med [Contributing Guide](/CONTRIBUTING.md) for miljøopsætning, kodestandarder og hvordan du åbner en pull request. Se [RELEASING.md](../RELEASING.md) for releaseprocessen for VS Code-udvidelsen og CLI'en, og [packages/neo-jetbrains/RELEASING.md](../packages/neo-jetbrains/RELEASING.md) for JetBrains-pluginet.

Læs venligst vores [Code of Conduct](/CODE_OF_CONDUCT.md), før du deltager.

### Licens

MIT. Du kan bruge, ændre og distribuere denne kode, også kommercielt, så længe du beholder attribution og licensmeddelelser. Se [License](/LICENSE).

### FAQ

<details>
<summary>Hvor kommer Neo CLI fra?</summary>

Neo CLI er en fork af [OpenCode](https://github.com/anomalyco/opencode), forbedret til at fungere i Neo agentic engineering-platformen.

</details>

---

**Deltag i fællesskabet** [Discord](https://neo.khulnasoft.com/discord) | [X](https://x.com/neocode) | [Reddit](https://www.reddit.com/r/neocode/)
