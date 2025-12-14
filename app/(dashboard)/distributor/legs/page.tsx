'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, User, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Spinner } from '@/components/ui/Spinner';
import Container from '@/components/layout/Container';
import { useToast } from '@/context/ToastContext';
import { distributorService } from '@/services/distributorService';
import { OrderLeg } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function OutgoingLegsPage() {
    const { showToast } = useToast();
    const [legs, setLegs] = useState<OrderLeg[]>([]);
    const [loading, setLoading] = useState(true);
    const [shippingLegId, setShippingLegId] = useState<number | null>(null);

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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
