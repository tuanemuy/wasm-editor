import type { Route } from "./+types/test";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "WASM Editor - Test" },
    { name: "description", content: "Your notes, all in one place" },
  ];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  console.log("Test client loader called");
  return "test1";
}

export default function Test({ loaderData }: Route.ComponentProps) {
  console.log("Test loader data:", loaderData);
  return <main>{loaderData}</main>;
}
