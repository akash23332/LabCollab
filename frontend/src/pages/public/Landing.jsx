import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Hero from '../../components/landing/Hero';
import StatsBar from '../../components/landing/StatsBar';
import FeaturesGrid from '../../components/landing/FeaturesGrid';
import NetworkSection from '../../components/landing/NetworkSection';
import DarkCTA from '../../components/landing/DarkCTA';
import LoginModal from '../../components/auth/LoginModal';
import { stats } from '../../data/landingData';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#4A3E37] antialiased selection:bg-[#F7ECD9] selection:text-[#965D25]">
      <Navbar />
      <main>
        <Hero />
        <StatsBar stats={stats} />
        <FeaturesGrid />
        <NetworkSection />
        <DarkCTA />
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
}
