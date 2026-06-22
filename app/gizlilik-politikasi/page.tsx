import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { getLegalDocument } from "@/lib/legal-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const doc = getLegalDocument("gizlilik-politikasi");

export const metadata: Metadata = {
  title: "Gizlilik Politikası — MarginalBridge",
  description: doc?.description,
};

export default function PrivacyPolicyPage() {
  if (!doc) notFound();
  return <LegalDocumentView document={doc} />;
}
