import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}