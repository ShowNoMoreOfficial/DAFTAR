import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "HOCCR" };

export default function HOCCRPage() {
  redirect("/hoccr/operations");
}
