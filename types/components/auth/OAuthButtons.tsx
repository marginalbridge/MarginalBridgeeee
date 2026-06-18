import Link from "next/link";

interface OAuthButtonsProps {
  redirect?: string;
  googleEnabled?: boolean;
  appleEnabled?: boolean;
}

export function OAuthButtons({
  redirect = "/dashboard",
  googleEnabled = false,
  appleEnabled = false,
}: OAuthButtonsProps) {
  if (!googleEnabled && !appleEnabled) {
    return null;
  }

  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-500">
        Hızlı kayıt / giriş
      </p>

      <div className="grid gap-3">
        {googleEnabled && (
          <Link
            href={`/api/auth/oauth/google${query}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <GoogleIcon />
            Google ile devam et
          </Link>
        )}

        {appleEnabled && (
          <Link
            href={`/api/auth/oauth/apple${query}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <AppleIcon />
            Apple ile devam et
          </Link>
        )}
      </div>

      <div className="relative pt-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-surface-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">veya e-posta ile</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.467 2.223-1.207 3.037-.773.857-2.043 1.523-3.158 1.432-.14-1.09.48-2.247 1.207-3.037.828-.914 2.234-1.573 3.158-1.432zM20.25 17.03c-.585 1.334-.86 1.928-1.607 3.11-1.043 1.625-2.516 3.652-4.34 3.667-1.622.014-2.043-1.06-4.252-1.048-2.21.012-2.672 1.062-4.295 1.048-1.824-.015-3.22-1.848-4.263-3.473-2.925-4.545-3.234-9.87-1.43-12.705 1.285-2.022 3.312-3.21 5.22-3.21 1.938 0 3.158 1.062 4.763 1.062 1.553 0 2.496-1.062 4.72-1.062 1.684 0 3.465.918 4.75 2.503-4.173 2.28-3.496 8.2.934 10.108z" />
    </svg>
  );
}
