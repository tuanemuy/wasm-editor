import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("memos/:id", "routes/memos.$id.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
