import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import WeatherAI from "./pages/WeatherAI";
import Camera from "./pages/Camera";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "sensors", Component: Sensors },
      { path: "weather-ai", Component: WeatherAI },
      { path: "camera", Component: Camera },
    ],
  },
]);
