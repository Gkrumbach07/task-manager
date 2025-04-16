import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the active page by default
  redirect("/active");
}
