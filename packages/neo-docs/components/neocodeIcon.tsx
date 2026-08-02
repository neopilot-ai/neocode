import React from "react"
import { Icon } from "./Icon"

interface neocodeIconProps {
  size?: string
}

export function neocodeIcon({ size = "1.2em" }: neocodeIconProps) {
  return <Icon src="/docs/img/neo-v1.svg" srcDark="/docs/img/neo-v1-white.svg" alt="Neo Code Icon" size={size} />
}
