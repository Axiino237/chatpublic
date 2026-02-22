import React from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Scale className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                        <p className="text-sm text-gray-500">Effective Date: January 2026</p>
                    </div>
                </div>

                <div className="prose prose-purple text-gray-600 max-w-none space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">1. Acceptance of Terms</h2>
                        <p>By using LoveLink, you agree to abide by these terms. If you do not agree, please do not use our service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">2. Eligibility</h2>
                        <p>You must be at least 18 years old to create an account. Misrepresenting your age is a violation of these terms and will lead to immediate account termination.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">3. Prohibited Conduct</h2>
                        <p>Users must not post profanity, engage in harassment, or use the platform for fraudulent activities. Our automated moderation system enforces these rules.</p>
                    </section>

                    <section className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <p className="text-orange-800 font-bold uppercase text-[10px] tracking-wider mb-1">Warning</p>
                        <p className="text-orange-900 text-xs">Viotations of conduct may result in a 5-minute mute or permanent ban depending on severity.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
