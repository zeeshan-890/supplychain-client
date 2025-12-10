'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Package, CheckCircle, XCircle, AlertCircle, User, MapPin, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/config/routes';
import { formatDate, formatCurrency } from '@/lib/utils';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

function VerifyPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('No verification token provided');
            setLoading(false);
            return;
        }

        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            setLoading(true);
            setError(null);

            // The auth token is in cookies (withCredentials: true), not localStorage
            const response = await axios.get(`${API_BASE_URL}/verify?token=${token}`, {
                withCredentials: true // Important for cookie-based auth
            });

            setVerificationResult(response.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                // Unauthorized - redirect to login
                const redirectUrl = encodeURIComponent(`/verify?token=${token}`);
                router.push(`${ROUTES.LOGIN}?redirect=${redirectUrl}`);
            } else {
                setError(err.response?.data?.message || 'Failed to verify token');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Spinner size="lg" />
                        <p className="mt-4 text-gray-600">Verifying product authenticity...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-700">Verification Failed</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-700 mb-6">{error}</p>
                        <Button onClick={() => router.push(ROUTES.HOME)} variant="outline">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!verificationResult) {
        return null;
    }

    const { valid, message, order, supplyChain } = verificationResult;

    if (!valid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-10 h-10 text-yellow-600" />
                        </div>
                        <CardTitle className="text-2xl text-yellow-700">Invalid Product</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-700 mb-6">{message || 'This product could not be verified'}</p>
                        <Button onClick={() => router.push(ROUTES.HOME)} variant="outline">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-4 px-3 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <Card className="mb-4 border-green-200 bg-white">
                    <CardContent className="text-center py-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                            <ShieldCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-green-700 mb-2">Product Verified!</h1>
                        <p className="text-gray-600 text-base">{message}</p>
                        <Badge variant="success" className="mt-3 px-3 py-1.5 text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Authentic Product
                        </Badge>
                    </CardContent>
                </Card>

                {/* Order Details */}
                {order && (
                    <Card className="mb-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="w-4 h-4" />
                                Order Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-start gap-2">
                                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Order ID</p>
                                        <p className="font-semibold text-sm text-gray-900">#{order.id}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Order Date</p>
                                        <p className="font-semibold text-sm text-gray-900">{formatDate(order.orderDate)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Product</p>
                                        <p className="font-semibold text-sm text-gray-900">{order.product?.name || 'N/A'}</p>
                                        {order.product?.category && (
                                            <p className="text-xs text-gray-600 mt-0.5">Category: {order.product.category}</p>
                                        )}
                                        {order.product?.batchNo && (
                                            <p className="text-xs text-gray-600">Batch: {order.product.batchNo}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Quantity</p>
                                        <p className="font-semibold text-sm text-gray-900">{order.quantity} units</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Supplier</p>
                                        <p className="font-semibold text-sm text-gray-900">{order.supplier?.name || 'N/A'}</p>
                                        {order.supplier?.contact && (
                                            <p className="text-xs text-gray-600 mt-0.5">{order.supplier.contact}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Customer</p>
                                        <p className="font-semibold text-sm text-gray-900">{order.customer?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                {order.deliveryAddress && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Delivery Address</p>
                                            <p className="font-semibold text-sm text-gray-900">{order.deliveryAddress}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {order.totalAmount && (
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-700">Total Amount</span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatCurrency(order.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Supply Chain Tracking */}
                {supplyChain && supplyChain.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="w-4 h-4" />
                                Supply Chain Journey
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {supplyChain.map((leg: any, index: number) => (
                                    <div key={leg.id} className="relative">
                                        {index !== supplyChain.length - 1 && (
                                            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-300" />
                                        )}
                                        <div className="flex gap-3">
                                            <div className="relative z-10 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-blue-700">{index + 1}</span>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <h4 className="font-semibold text-sm text-gray-900">
                                                            {leg.fromType} → {leg.toType}
                                                        </h4>
                                                        <Badge variant={leg.status === 'DELIVERED' ? 'success' : 'info'} className="text-xs">
                                                            {leg.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 text-xs mt-2">
                                                        {leg.fromSupplier && (
                                                            <p className="text-gray-600">
                                                                From: <span className="font-medium text-gray-900">{leg.fromSupplier.businessName}</span>
                                                            </p>
                                                        )}
                                                        {leg.fromDistributor && (
                                                            <p className="text-gray-600">
                                                                From: <span className="font-medium text-gray-900">{leg.fromDistributor.businessName}</span>
                                                            </p>
                                                        )}
                                                        {leg.toDistributor && (
                                                            <p className="text-gray-600">
                                                                To: <span className="font-medium text-gray-900">{leg.toDistributor.businessName}</span>
                                                            </p>
                                                        )}
                                                        {leg.toCustomer && (
                                                            <p className="text-gray-600">
                                                                To: <span className="font-medium text-gray-900">{leg.toCustomer.name}</span>
                                                            </p>
                                                        )}
                                                        {leg.transporter && (
                                                            <p className="text-gray-600">
                                                                Transporter: <span className="font-medium text-gray-900">{leg.transporter.name}</span>
                                                            </p>
                                                        )}
                                                        {leg.acceptedAt && (
                                                            <p className="text-gray-600">
                                                                Accepted: <span className="font-medium text-gray-900">{formatDate(leg.acceptedAt)}</span>
                                                            </p>
                                                        )}
                                                        {leg.deliveredAt && (
                                                            <p className="text-gray-600">
                                                                Delivered: <span className="font-medium text-gray-900">{formatDate(leg.deliveredAt)}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="mt-4 text-center pb-4">
                    <Button onClick={() => router.push(ROUTES.HOME)} variant="outline">
                        Return to Home
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Spinner size="lg" />
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <VerifyPageContent />
        </Suspense>
    );
}
