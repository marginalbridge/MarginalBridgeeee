import Image from "next/image";
import Link from "next/link";

const sizeClasses = {
  sm: "h-11 w-auto",
  md: "h-14 w-auto",
  lg: "h-20 w-auto",
} as const;

interface LogoProps {
  size?: keyof typeof sizeClasses;
  href?: string | null;
  className?: string;
}

export function Logo({ size = "md", href = "/", className = "" }: LogoProps) {
  const image = (
    <Image
      src="/logo.png"
      alt="Marginal Bridge"
      width={442}
      height={373}
      priority
      className={`${sizeClasses[size]} ${className}`.trim()}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}
