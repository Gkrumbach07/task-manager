import Footer from "@/components/footer";
import Header from "@/components/header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 inline-flex justify-center">{children}</div>
      <Footer />
    </div>
  );
}
