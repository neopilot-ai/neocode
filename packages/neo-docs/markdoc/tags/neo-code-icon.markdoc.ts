import { neocodeIcon as NeocodeIcon } from "../../components"

export const neocodeIcon = {
  render: NeocodeIcon,
  selfClosing: true,
  attributes: {
    size: {
      type: String,
      default: "1.2em",
      description: "Size of the icon (CSS height value)",
    },
  },
}
