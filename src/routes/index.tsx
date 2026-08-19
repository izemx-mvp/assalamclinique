import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/erp/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedFlow ERP — Interventions & Audit IA des dossiers" },
      {
        name: "description",
        content:
          "ERP médical MedFlow : paramétrage des interventions, ordre strict des pièces, audit IA des dossiers et compilation PDF pour PEC et expédition.",
      },
      { property: "og:title", content: "MedFlow ERP — Interventions & Audit IA" },
      {
        property: "og:description",
        content:
          "Configurez les matrices de pièces par organisme et mode, puis auditez et compilez les dossiers d'intervention.",
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
      <h1 className="sr-only">MedFlow ERP — Module Interventions</h1>
      <Shell />
      <Toaster position="top-right" />
    </>
  );
}
