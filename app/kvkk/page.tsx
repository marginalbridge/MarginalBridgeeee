import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const doc = getLegalDocument("kvkk");

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — MarginalBridge",
  description: doc?.description,
};

export default function KvkkPage() {
  if (!doc) notFound();
  return <LegalDocumentView document={doc} />;
}
