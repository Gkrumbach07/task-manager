import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-sm font-medium underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm font-medium underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/help" className="text-sm font-medium underline-offset-4 hover:underline">
            Help
          </Link>
        </div>
      </div>
    </footer>
  )
}
