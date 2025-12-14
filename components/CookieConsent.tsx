'use client';

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { Button } from './ui/Button';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setShowBanner(false);
    };

    const rejectCookies = () => {
        localStorage.setItem('cookieConsent', 'rejected');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t-2 border-gray-200 shadow-2xl animate-slide-up">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Icon and Message */}
                    <div className="flex items-start gap-3 flex-1">
                        <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                                We use cookies
                            </h3>
                            <p className="text-sm text-gray-600">
                                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                                By clicking "Accept All", you consent to our use of cookies. 
                                <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">
                                    Learn more
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={rejectCookies}
                            className="whitespace-nowrap"
                        >
                            Reject All
                        </Button>
                        <Button
                            size="sm"
                            onClick={acceptCookies}
                            className="whitespace-nowrap"
                        >
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
