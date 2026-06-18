import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import {
  isAppleOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; redirect_uri?: string }>;
}) {
  const { redirect, error, redirect_uri: redirectUriHint } = await searchParams;

  return (
    <AuthLayout
      title="Hoş Geldiniz"
      subtitle="MarginalBridge hesabınıza giriş yapın"
    >
      <div className="space-y-6">
        <OAuthButtons
          redirect={redirect ?? "/dashboard"}
          googleEnabled={isGoogleOAuthConfigured()}
          appleEnabled={isAppleOAuthConfigured()}
        />
        <LoginForm
          redirect={redirect ?? "/dashboard"}
          initialError={error}
          redirectUriHint={redirectUriHint}
        />
      </div>
    </AuthLayout>
  );
}
