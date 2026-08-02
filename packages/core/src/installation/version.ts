declare global {
  const NEO_VERSION: string
  const NEO_CHANNEL: string
  const NEO_BUILD_KIND: string // neocode_change
}

export const InstallationVersion = typeof NEO_VERSION === "string" ? NEO_VERSION : "local"
export const InstallationChannel = typeof NEO_CHANNEL === "string" ? NEO_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
// neocode_change start - distinguish release builds from source / local builds
export const InstallationBuildKind: "source" | "release" =
  typeof NEO_BUILD_KIND === "string" && NEO_BUILD_KIND === "release" ? "release" : "source"
// neocode_change end
