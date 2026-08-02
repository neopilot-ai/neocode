<p align="center">
  <a href="../README.md">English</a> | <a href="README.zh.md">简体中文</a> | <a href="README.zht.md">繁體中文</a> | <a href="README.ko.md">한국어</a> | <a href="README.de.md">Deutsch</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.it.md">Italiano</a> | <a href="README.da.md">Dansk</a> | <a href="README.ja.md">日本語</a> | <a href="README.pl.md">Polski</a> | <a href="README.ru.md">Русский</a> | <a href="README.bs.md">Bosanski</a> | <a href="README.ar.md">العربية</a> | <a href="README.no.md">Norsk</a> | <a href="README.br.md">Português (Brasil)</a> | <a href="README.th.md">ไทย</a> | Türkçe | <a href="README.uk.md">Українська</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.gr.md">Ελληνικά</a> | <a href="README.vi.md">Tiếng Việt</a>
</p>

<p align="center">
  <a href="https://neo.khulnasoft.com"><img width="250" alt="Neo Code logo" src="https://github.com/user-attachments/assets/bdb0c174-b9fd-40ad-a47b-f3aab9b54e8d" /></a>
</p>

<p align="center">VS Code, JetBrains veya CLI'de AI ile geliştirme yapmak için açık kaynak kodlama ajanı.</p>

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

Neo Code, çalıştığınız her yerde size eşlik eden bir AI kodlama ajanıdır: [VS Code](https://neo.khulnasoft.com/landing/vs-code), [JetBrains](https://neo.khulnasoft.com/features/jetbrains-native) ve [CLI](https://neo.khulnasoft.com/cli). Açık kaynaktır ve açık fiyatlandırma sunar. 500'den fazla model arasından seçim yapabilir, görev sırasında model değiştirebilir ve hiçbir ek ücret olmadan model sağlayıcısının fiyatını ödersiniz. Başlamak için API anahtarı gerekmez.

### Kurulum

Neo'yu nerede çalıştırmak istediğinizi seçin.

<details open>
<summary><strong>VS Code</strong></summary>

<br>

[Neo Code uzantısını](vscode:extension/neocode.neo-code) doğrudan kurun veya [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=neocode.Neo-Code) üzerinden edinin. Bir hesap oluşturduğunuzda GPT-5.5, Claude Opus 4.7, Claude Sonnet 4.6 ve Gemini 3.1 Pro Preview dahil 500'den fazla modele sağlayıcı fiyatıyla erişebilirsiniz.

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

Ardından başlamak için herhangi bir proje dizininde `neo` çalıştırın.

</details>

<details>
<summary><strong>JetBrains</strong></summary>

<br>

[Neo Code eklentisini](https://plugins.jetbrains.com/plugin/28350-neo-code) JetBrains Marketplace'ten kurun veya herhangi bir JetBrains IDE içinde `Settings → Plugins` bölümünde "Neo Code" arayın.

</details>

<details>
<summary><strong>Cloud Agent</strong></summary>

<br>

Neo'yu yerel makine gerekmeden web üzerinden [app.neo.khulnasoft.com/cloud](https://app.neo.khulnasoft.com/cloud) adresinde çalıştırın.

</details>

<details>
<summary><strong>Kod İncelemeleri</strong></summary>

<br>

Pull request'leriniz için otomatik AI kod incelemelerini [app.neo.khulnasoft.com/code-reviews](https://app.neo.khulnasoft.com/code-reviews) adresinde ayarlayın.

</details>

<details>
<summary><strong>NeoClaw</strong></summary>

<br>

Her zaman açık AI ajanınızı [app.neo.khulnasoft.com/claw](https://app.neo.khulnasoft.com/claw) adresinde başlatın.

</details>

<details>
<summary>CLI'yi GitHub Releases üzerinden kurun (ikili dosyalar)</summary>

En son ikili dosyayı [Releases sayfasından](https://github.com/Neopilot-Ai/neocode/releases) indirin.

| Platform | Asset |
|---|---|
| Windows (çoğu PC) | `neo-windows-x64.zip` |
| macOS (Apple Silicon) | `neo-darwin-arm64.zip` |
| macOS (Intel) | `neo-darwin-x64.zip` |
| Linux x64 | `neo-linux-x64.tar.gz` |
| Linux ARM | `neo-linux-arm64.tar.gz` |

Notlar: `x64-baseline`, AVX olmayan eski CPU'lar için uyumluluk derlemesidir. `musl`, Alpine veya glibc olmayan minimal Docker imajları için statik bağlı derlemedir. `neo-vscode-*.vsix` CLI değil VS Code uzantı paketidir. `Source code` arşivleri kaynaktan derlemek içindir.

</details>

### Agents

Neo, göreve göre aralarında geçiş yapabileceğiniz özelleşmiş agents ile gelir. Kendi özel agents'larınızı da oluşturabilirsiniz.

- **Code** - Varsayılan. Doğal dilden kod uygular ve düzenler.
- **Plan** - Kod yazılmadan önce mimari tasarlar ve uygulama planları yazar.
- **Ask** - Dosyalara dokunmadan kod tabanınız hakkında soruları yanıtlar.
- **Debug** - Sorunları giderir ve izler.
- **Review** - Değişikliklerinizi inceler ve performans, güvenlik, stil ve test kapsamı sorunlarını ortaya çıkarır.

[Agents ve özel agents](https://neo.khulnasoft.com/docs/code-with-ai/agents/using-agents) hakkında daha fazla bilgi edinin.

### Ne yapar

- Birden çok dosyada doğal dilden **kod üretimi**.
- Ghost-text önerileri ve kabul etmek için Tab ile **satır içi otomatik tamamlama**.
- Ajanın kendi çalışmasını inceleyip düzeltmesi için **öz denetim**.
- Komut çalıştırmak ve web'i otomatikleştirmek için **terminal ve tarayıcı kontrolü**.
- Ajanın yapabileceklerini genişleten MCP sunucularını bulmak ve bağlamak için **MCP marketplace**.
- Gecikme, maliyet ve akıl yürütmeyi işe uygun seçmek için görev sırasında geçiş destekli **500'den fazla model**.

### Otonom Mod (CI/CD)

CI/CD pipeline'ları için prompts olmadan tamamen otonom çalıştırmak üzere `neo run` komutunu `--auto` ile çalıştırın:

```bash
neo run --auto "run tests and fix any failures"
```

`--auto` tüm izin istemlerini devre dışı bırakır ve ajanın herhangi bir işlemi onay olmadan yürütmesine izin verir. Yalnızca güvenilir ortamlarda kullanın.

### Dokümantasyon

Yapılandırma ve diğer her şey için [dokümantasyona](https://neo.khulnasoft.com/docs) bakın.

### Katkıda bulunma

Geliştiricilerden, yazarlardan ve herkesten katkı bekliyoruz. Ortam kurulumu, kodlama standartları ve pull request açma hakkında bilgi için [Contributing Guide](/CONTRIBUTING.md) ile başlayın. VS Code uzantısı ve CLI yayın süreci için [RELEASING.md](../RELEASING.md), JetBrains eklentisi için [packages/neo-jetbrains/RELEASING.md](../packages/neo-jetbrains/RELEASING.md) dosyasına bakın.

Katılmadan önce lütfen [Code of Conduct](/CODE_OF_CONDUCT.md) belgemizi okuyun.

### Lisans

MIT. Atıf ve lisans bildirimlerini koruduğunuz sürece bu kodu ticari olarak da kullanabilir, değiştirebilir ve dağıtabilirsiniz. Bkz. [License](/LICENSE).

### FAQ

<details>
<summary>Neo CLI nereden geldi?</summary>

Neo CLI, Neo agentic engineering platformunda çalışacak şekilde geliştirilmiş bir [OpenCode](https://github.com/anomalyco/opencode) fork'udur.

</details>

---

**Topluluğa katılın** [Discord](https://neo.khulnasoft.com/discord) | [X](https://x.com/neocode) | [Reddit](https://www.reddit.com/r/neocode/)
