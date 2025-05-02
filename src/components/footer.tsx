export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0 inline-flex justify-center">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
