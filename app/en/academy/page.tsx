import { metadataAcademy, PaginaAcademy } from "@/components/paginas/Academy";

export const metadata = metadataAcademy("en");

export default function Page() {
  return <PaginaAcademy lingua="en" />;
}
