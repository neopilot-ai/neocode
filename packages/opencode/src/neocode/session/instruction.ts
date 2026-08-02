import { NeocodeMarkdown } from "../config/markdown"

export namespace NeocodeInstruction {
  export function content(text: string, item: string, options: NeocodeMarkdown.Options) {
    return NeocodeMarkdown.substitute(text, item, options)
  }

  export async function read(item: string, options: NeocodeMarkdown.Options) {
    return content(await NeocodeMarkdown.read(item, options), item, options)
  }
}
