import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

const AdComponent: React.FC = () => {
    return (
        <div className="my-6 px-4">
            <div className="max-w-xl mx-auto bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 relative overflow-hidden group">
                {/* Ad Content */}
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-[#3b5998]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <img
                            src="https://via.placeholder.com/150/3b5998/ffffff?text=AD"
                            alt="Ad"
                            className="h-full w-full object-cover rounded-xl"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 rounded uppercase tracking-tighter">Sponsored</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Professional Networking Solutions</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            Connect with industry leaders and grow your career with our advanced networking tools. Sign up for free today!
                        </p>
                    </div>
                    <button className="self-center p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <ExternalLink size={16} className="text-blue-500" />
                    </button>
                </div>

                {/* Info Badge */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info size={12} className="text-gray-400 cursor-help" />
                </div>

                {/* Background Decoration */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
            </div>
        </div>
    );
};

export default AdComponent;
