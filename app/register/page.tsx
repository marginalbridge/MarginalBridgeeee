import { AuthLayout } from "@/components/auth/AuthLayout";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  isAppleOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/config";
import { getPlanById, type PlanId } from "@/lib/pricing";

const validPlans: PlanId[] = ["starter", "professional", "enterprise"];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const planId = validPlans.includes(plan as PlanId) ? (plan as PlanId) : undefined;
  const selectedPlan = planId ? getPlanById(planId) : undefined;

  return (
    <AuthLayout
      title="Hesap Oluştur"
      subtitle={
        selectedPlan
          ? `${selectedPlan.name} paketi ile 14 gün ücretsiz deneyin`
          : "Cross-border satıcılar için marj koruma platformu"
      }
    >
      <div className="space-y-6">
        <OAuthButtons
          redirect="/dashboard"
          googleEnabled={isGoogleOAuthConfigured()}
          appleEnabled={isAppleOAuthConfigured()}
        />
        <RegisterForm planId={planId} />
      </div>
    </AuthLayout>
  );
}
