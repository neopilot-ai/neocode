export const Npm = {
  name: "@neocode/cli",
  path: "@neocode%2fcli",
}

export const Brew = {
  name: "neo",
  tap: "Neopilot-Ai/tap",
  formula: "Neopilot-Ai/tap/neo",
  api: "https://formulae.brew.sh/api/formula/neo.json",
}

export const Choco = {
  name: "neo",
  api: "https://community.chocolatey.org/api/v2/Packages?$filter=Id%20eq%20%27neo%27%20and%20IsLatestVersion&$select=Version",
}

export const Scoop = {
  name: "neo",
  manifest: "https://raw.githubusercontent.com/ScoopInstaller/Main/master/bucket/neo.json",
}

export const Release = {
  install: "https://neo.khulnasoft.com/cli/install",
}
