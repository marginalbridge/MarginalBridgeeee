@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --border: 214 32% 91%;
    --accent: 174 72% 36%;
    --accent-glow: 174 72% 36% / 0.15;
  }

  * {
    @apply border-surface-border;
  }

  body {
    @apply bg-white text-gray-900 antialiased;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.06), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(59, 130, 246, 0.04), transparent);
    min-height: 100vh;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }

  ::-webkit-scrollbar-thumb {
    @apply rounded-full bg-gray-300;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }
}

@layer components {
  .glass-card {
    @apply rounded-xl border border-surface-border bg-white shadow-card;
  }

  .stat-value {
    @apply text-2xl font-bold tracking-tight text-gray-900;
  }

  .badge {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium;
  }

  .badge-success {
    @apply badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200;
  }

  .badge-warning {
    @apply badge bg-amber-50 text-amber-700 ring-1 ring-amber-200;
  }

  .badge-danger {
    @apply badge bg-red-50 text-red-700 ring-1 ring-red-200;
  }

  .badge-info {
    @apply badge bg-blue-50 text-blue-700 ring-1 ring-blue-200;
  }

  .badge-neutral {
    @apply badge bg-gray-100 text-gray-600 ring-1 ring-gray-200;
  }

  .input-field {
    @apply w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-bridge-500 focus:ring-1 focus:ring-bridge-500/40;
  }
}
