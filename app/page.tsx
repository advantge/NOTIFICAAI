import type { Metadata } from "next";
import { NotificaApp } from "../src/ui/notifica-app";

export const metadata: Metadata = {
  title: "Notifica AI — Pagamentos que chegam à pessoa certa",
  description:
    "Cobranças Pix individuais, confirmação segura e alertas em tempo real para sua equipe.",
};

export default function Home() {
  return <NotificaApp />;
}
