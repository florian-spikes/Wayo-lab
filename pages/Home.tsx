import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Workflow from '../components/Workflow';
import Testimonials from '../components/Testimonials';
import StickyCTA from '../components/StickyCTA';
import Footer from '../components/Footer';

const Home: React.FC = () => {
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show sticky CTA after scrolling past the hero (approx 600px)
            if (window.scrollY > 600) {
                setShowStickyCTA(true);
            } else {
                setShowStickyCTA(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Navbar />

            <main className="flex-grow">
                <Hero />
                <Features />
                <Workflow />
                <Testimonials />
            </main>

            <Footer />
            <StickyCTA isVisible={showStickyCTA} />
        </div>
    );
};

export default Home;
