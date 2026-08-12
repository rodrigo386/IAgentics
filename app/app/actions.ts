"use server";
import { signOut } from "@/auth";

export async function sairAction() {
  await signOut({ redirectTo: "/app/entrar" });
}
