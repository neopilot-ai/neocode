import { CommandHandler } from "../command-handler"
import { LoadProvidersUseCase } from "@neocode-ai/application"

/**
 * CLI adapter for listing providers.
 *
 * Usage:
 * neocode provider list
 *
 * Bridge between CLI and use case.
 */
export class ListProvidersCommand extends CommandHandler {
  async execute(): Promise<void> {
    try {
      this.printInfo("Loading providers...")

      const usecase = new LoadProvidersUseCase(this.container.getProviderRepository(), this.container.getLogger())

      const result = await usecase.execute()

      if (!result.ok) {
        this.printError(result.error)
        process.exit(1)
      }

      const providers = result.value

      if (providers.length === 0) {
        this.printInfo("No providers found")
        return
      }

      this.printSuccess(`Found ${providers.length} provider(s)`)

      // Simple table format
      const maxNameLength = Math.max(...providers.map((p) => p.name.length))
      const maxDisplayLength = Math.max(...providers.map((p) => p.displayName.length))

      console.log("")
      console.log(
        [
          "ID".padEnd(20),
          "Name".padEnd(maxNameLength + 2),
          "Display Name".padEnd(maxDisplayLength + 2),
          "Enabled",
          "Models",
        ].join("|"),
      )
      console.log("-".repeat(100))

      providers.forEach((p) => {
        console.log(
          [
            p.id.padEnd(20),
            p.name.padEnd(maxNameLength + 2),
            p.displayName.padEnd(maxDisplayLength + 2),
            (p.isEnabled ? "✓" : "✗").padEnd(7),
            p.modelCount.toString(),
          ].join("|"),
        )
      })
      console.log("")
    } catch (error) {
      this.printError(error instanceof Error ? error : new Error(String(error)))
      process.exit(1)
    }
  }
}
