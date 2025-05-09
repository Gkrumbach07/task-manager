export default function TaskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container py-6">{children}</div>;
}
