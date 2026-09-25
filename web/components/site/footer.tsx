import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-[1400px] px-4 text-sm text-muted-foreground md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>
            CommerceLens &mdash; a synthetic e-commerce analytics portfolio project. All figures are computed
            from a generated dataset; see{" "}
            <Link href="/limitations" className="underline underline-offset-2 hover:text-foreground">
              Limitations
            </Link>{" "}
            before treating any number as a real-world benchmark.
          </p>
          <div className="flex gap-4">
            <Link href="/case-study" className="hover:text-foreground">
              Case Study
            </Link>
            <Link href="/data-explorer" className="hover:text-foreground">
              Data Explorer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
