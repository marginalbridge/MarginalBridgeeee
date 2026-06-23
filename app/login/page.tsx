import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import LoginButton from "@/components/LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; redirect_uri?: string }>;
}) {
  const { redirect, error, redirect_uri: redirectUriHint } = await searchParams;
  const destination = redirect ?? "/dashboard";

  return (
    <AuthLayout
      title="Hoş Geldiniz"
      subtitle="MarginalBridge hesabınıza giriş yapın"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">
            Hızlı giriş
          </p>
          <LoginButton callbackUrl={destination} />
        </div>

        <div className="relative pt-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-surface-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">veya e-posta ile</span>
          </div>
        </div>

        <LoginForm
          redirect={destination}
          initialError={error}
          redirectUriHint={redirectUriHint}
        />
      </div>
    </AuthLayout>
  );
}
