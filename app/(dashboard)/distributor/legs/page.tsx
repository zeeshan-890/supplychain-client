'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Printer, X, Truck, User, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import Container from '@/components/layout/Container';
import { useToast } from '@/context/ToastContext';
import { distributorService } from '@/services/distributorService';
import { OrderLeg } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode';

export default function OutgoingLegsPage() {
    const { showToast } = useToast();
    const [legs, setLegs] = useState<OrderLeg[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [selectedLeg, setSelectedLeg] = useState<any>(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [shippingLegId, setShippingLegId] = useState<number | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLegs();
    }, []);

    const handleShip = async (legId: number) => {
        try {
            setShippingLegId(legId);
            await distributorService.shipForward(legId);
            showToast('Shipment marked as in transit!', 'success');
            fetchLegs();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to ship', 'error');
        } finally {
            setShippingLegId(null);
        }
    };

    const fetchLegs = async () => {
        try {
            setLoading(true);
            const data = await distributorService.getOutgoingLegs();
            setLegs(data);
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to fetch legs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleShowQR = async (leg: any) => {
        setSelectedLeg(leg);

        // Generate QR code from the order's qrToken - link to frontend verification page
        if (leg.order?.qrToken) {
            const frontendUrl = window.location.origin;
            const verificationUrl = `${frontendUrl}/verify?token=${leg.order.qrToken}`;

            try {
                const dataUrl = await QRCode.toDataURL(verificationUrl, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
                setQrCodeDataUrl(dataUrl);
            } catch (err) {
                console.error('Error generating QR code:', err);
                showToast('Failed to generate QR code', 'error');
            }
        }

        setShowQRDialog(true);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const verificationLink = `${window.location.origin}/verify?token=${selectedLeg?.order?.qrToken}`;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Please allow popups to print', 'error');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - Order #${selectedLeg?.order?.id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        text-align: center;
                    }
                    .container {
                        max-width: 400px;
                        margin: 0 auto;
                        border: 2px dashed #ccc;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    .title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .qr-code {
                        margin: 20px 0;
                    }
                    .qr-code img {
                        width: 200px;
                        height: 200px;
                    }
                    .info {
                        text-align: left;
                        font-size: 12px;
                        margin-top: 15px;
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                    }
                    .info p {
                        margin: 5px 0;
                    }
                    .info strong {
                        display: inline-block;
                        width: 100px;
                    }
                    .link-section {
                        margin-top: 15px;
                        padding-top: 15px;
                        border-top: 1px solid #eee;
                        text-align: left;
                    }
                    .link-section strong {
                        display: block;
                        margin-bottom: 5px;
                        font-size: 11px;
                    }
                    .link-section code {
                        display: block;
                        background: #f5f5f5;
                        padding: 8px;
                        font-size: 9px;
                        word-break: break-all;
                        border: 1px solid #ddd;
                    }
                    .footer {
                        margin-top: 15px;
                        font-size: 10px;
                        color: #666;
                    }
                    @media print {
                        body { padding: 0; }
                        .container { border: 2px dashed #000; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="title">📦 Supply Chain Verification</div>
                    <div class="qr-code">
                        <img src="${qrCodeDataUrl}" alt="QR Code" />
                    </div>
                    <div class="info">
                        <p><strong>Order ID:</strong> #${selectedLeg?.order?.id}</p>
                        <p><strong>Product:</strong> ${selectedLeg?.order?.product?.name}</p>
                        <p><strong>Quantity:</strong> ${selectedLeg?.order?.quantity}</p>
                        <p><strong>Customer:</strong> ${selectedLeg?.order?.customer?.name}</p>
                        <p><strong>Transporter:</strong> ${selectedLeg?.transporter?.name}</p>
                    </div>
                    <div class="link-section">
                        <strong>Verification Link:</strong>
                        <code>${verificationLink}</code>
                    </div>
                    <div class="footer">
                        Scan this QR code or visit the link above to verify product authenticity
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default'> = {
            'DELIVERED': 'success',
            'IN_TRANSIT': 'info',
            'ACCEPTED': 'warning',
            'PENDING': 'default',
            'REJECTED': 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <Container>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Spinner size="lg" />
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outgoing Shipments</h1>
                    <p className="text-muted-foreground mt-2">
                        Track deliveries you've sent to customers or other distributors
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{legs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                            <Truck className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {legs.filter(l => l.status === 'IN_TRANSIT' || l.status === 'ACCEPTED').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                            <Package className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {legs.filter(l => l.status === 'DELIVERED').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">To Customers</CardTitle>
                            <User className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {legs.filter(l => l.toType === 'CUSTOMER').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Shipment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {legs.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No outgoing shipments</h3>
                                <p className="text-gray-600">You haven't sent out any deliveries yet</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Transporter</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {legs.map((leg: any) => (
                                        <TableRow key={leg.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <span className="font-semibold">#{leg.order?.id}</span>
                                                    <span className="text-xs text-gray-500 block">Leg #{leg.legNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{leg.order?.product?.name || 'N/A'}</span>
                                                    <span className="text-xs text-gray-500 block">Qty: {leg.order?.quantity}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {leg.toType === 'CUSTOMER' ? (
                                                        <Badge variant="success" className="text-xs">
                                                            <User className="w-3 h-3 mr-1" />
                                                            Customer
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="info" className="text-xs">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {leg.toDistributor?.businessName || 'Distributor'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{leg.order?.customer?.name || 'N/A'}</span>
                                                    <span className="text-xs text-gray-500 block">{leg.order?.customer?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <span className="font-medium">{leg.transporter?.name || 'N/A'}</span>
                                                    <span className="text-xs text-gray-500 block">{leg.transporter?.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(leg.status)}</TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(leg.order?.totalAmount || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {/* Ship button for PENDING or ACCEPTED legs */}
                                                    {(leg.status === 'PENDING' || leg.status === 'ACCEPTED') && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleShip(leg.id)}
                                                            disabled={shippingLegId === leg.id}
                                                        >
                                                            {shippingLegId === leg.id ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <>
                                                                    <Send className="w-4 h-4 mr-1" />
                                                                    Ship
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {/* QR button for customer deliveries after shipping */}
                                                    {leg.toType === 'CUSTOMER' && leg.order?.qrToken && (leg.status === 'IN_TRANSIT' || leg.status === 'DELIVERED') && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleShowQR(leg)}
                                                        >
                                                            <Printer className="w-4 h-4 mr-1" />
                                                            QR
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* QR Code Dialog */}
                <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)}>
                    <div className="p-4 max-h-[90vh] overflow-y-auto" ref={printRef}>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">Package QR Code</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowQRDialog(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {selectedLeg && (
                            <div className="space-y-3">
                                {/* Order Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h3 className="font-semibold text-base mb-2 text-gray-900">Order #{selectedLeg.order?.id}</h3>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Product:</span>
                                            <span className="font-semibold text-gray-900">{selectedLeg.order?.product?.name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Quantity:</span>
                                            <span className="font-semibold text-gray-900">{selectedLeg.order?.quantity}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="font-semibold text-gray-900">{selectedLeg.order?.customer?.name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-semibold text-gray-900">{formatCurrency(selectedLeg.order?.totalAmount || 0)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Transporter:</span>
                                            <span className="font-semibold text-gray-900">{selectedLeg.transporter?.name}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-semibold text-gray-900">{selectedLeg.transporter?.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center py-2">
                                    {qrCodeDataUrl ? (
                                        <>
                                            <img
                                                src={qrCodeDataUrl}
                                                alt="QR Code"
                                                className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                                            />
                                            <p className="text-xs text-gray-600 mt-2 text-center">
                                                Customer scans this code to verify authenticity
                                            </p>

                                            {/* Verification Link */}
                                            <div className="w-full mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <label className="text-xs text-gray-500 font-medium block mb-1">Verification Link:</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${window.location.origin}/verify?token=${selectedLeg.order?.qrToken}`}
                                                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded text-gray-700 font-mono"
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/verify?token=${selectedLeg.order?.qrToken}`);
                                                            showToast('Link copied to clipboard!', 'success');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <p className="text-gray-500">No QR code available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button onClick={handlePrint} className="flex-1">
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print QR Code
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowQRDialog(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Dialog>
            </div>
        </Container>
    );
}
