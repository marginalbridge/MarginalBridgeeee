import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const doc = getLegalDocument("kullanim-kosullari");

export const metadata: Metadata = {
  title: "Kullanım Koşulları — MarginalBridge",
  description: doc?.description,
};

export default function TermsOfUsePage() {
  if (!doc) notFound();
  return <LegalDocumentView document={doc} />;
}
