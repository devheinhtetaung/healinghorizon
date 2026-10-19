import PageTransition from '../components/PageTransition';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ToastProvider from '../components/ui/ToastContext';

export default function PublicLayout() {
  return (
    <ToastProvider>
      <div className="public-layout">
        <Header />
        <main className="public-layout__main">
          <PageTransition />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
