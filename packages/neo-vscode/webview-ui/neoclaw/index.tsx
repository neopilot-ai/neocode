// NeoClaw SolidJS webview entry point

import { render } from "solid-js/web"
import "@neocode/neo-ui/styles"
import "./neoclaw.css"
import { NeoClawApp } from "./NeoClawApp"

const root = document.getElementById("root")
if (root) {
  render(() => <NeoClawApp />, root)
}
