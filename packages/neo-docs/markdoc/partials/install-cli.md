Use Neo Code directly from your terminal for maximum flexibility.

### Install via npm

```bash
npm install -g @neocode/cli
```

### Older CPUs (No AVX Support)

If you're running on an older CPU without AVX support (e.g., Intel Xeon Nehalem, AMD Bulldozer, or older), the CLI may crash with "Illegal instruction". In that case, download the **baseline** variant from GitHub releases:

1. Go to [Neo Releases](https://github.com/Neopilot-Ai/neocode/releases)
2. Download the `-baseline` variant for your platform:
   - Linux x64: `neo-linux-x64-baseline.tar.gz`
   - macOS x64: `neo-darwin-x64-baseline.zip`
   - Windows x64: `neo-windows-x64-baseline.zip`
3. Extract and run the `neo` binary directly

### Verify Installation

```bash
neo --version
```
