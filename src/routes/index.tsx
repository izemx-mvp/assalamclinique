import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/erp/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CLINIQUE ASSALAM ERP — AI Interventions & dossiers" },
      {
        name: "description",
        content:
          "ERP Clinique Assalam : paramétrage des interventions, référentiels de pièces par organisme, audit IA des dossiers et compilation PDF pour PEC et expédition.",
      },
      { property: "og:title", content: "CLINIQUE ASSALAM ERP — AI Interventions" },
      {
        property: "og:description",
        content:
          "Configurez les référentiels de pièces par organisme et mode, puis auditez et transmettez les dossiers d'intervention.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <h1 className="sr-only">CLINIQUE ASSALAM ERP — Module AI Interventions</h1>
      <Shell />
      <Toaster position="top-right" />
    </>
  );
}
