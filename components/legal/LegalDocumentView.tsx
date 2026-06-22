import type { LegalDocument } from "@/lib/legal-content";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

interface LegalDocumentViewProps {
  document: LegalDocument;
}

export function LegalDocumentView({ document }: LegalDocumentViewProps) {
  return (
    <LegalPageLayout
      title={document.title}
      description={document.description}
      updatedAt={document.updatedAt}
      activeSlug={document.slug}
    >
      {document.sections.map((section) => (
        <section key={section.title} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
          {section.bullets && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </LegalPageLayout>
  );
}
