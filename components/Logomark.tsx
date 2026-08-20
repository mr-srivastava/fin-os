import Image from "next/image";

export function Logomark({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/mark-light.png"
        alt="MF OS"
        width={920}
        height={530}
        priority
        className={`block dark:hidden ${className ?? ""}`}
      />
      <Image
        src="/mark-dark.png"
        alt="MF OS"
        width={1028}
        height={595}
        priority
        className={`hidden dark:block ${className ?? ""}`}
      />
    </>
  );
}
