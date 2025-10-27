/* @refresh reload */
import { render } from "solid-js/web"
import { Router } from "@solidjs/router"
import { routes } from "./config/routes"
import App from "./App"

render(
  () => <Router root={App}>{routes}</Router>,
  document.getElementById("root")!,
)
