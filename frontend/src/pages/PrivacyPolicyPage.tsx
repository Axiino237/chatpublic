import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
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
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                        <p className="text-sm text-gray-500">Last updated: January 2026</p>
                    </div>
                </div>

                <div className="prose prose-blue text-gray-600 max-w-none space-y-6 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us when you create an account, including your email, name, gender, and date of birth.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">2. How We Use Your Information</h2>
                        <p>We use your information to provide and improve our services, facilitate matches, and communicate with you about your account and security.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">3. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">4. 18+ Verification</h2>
                        <p>LoveLink is strictly for adults. We verify age during registration to ensure all users are over 18 years old.</p>
                    </section>

                    <section className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-blue-800 italic">"Your privacy is our priority. We never sell your personal data to third parties."</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
