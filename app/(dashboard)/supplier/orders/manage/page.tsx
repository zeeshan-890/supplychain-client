"use client";

import { useState } from "react";
import { Eye, Check, X, RefreshCw, Package, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Container from "@/components/layout/Container";
import { useFetch } from "@/hooks/useFetch";
import { supplierService } from "@/services/supplierService";
import { orderService } from "@/services/orderService";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OrderStatus } from "@/types/enums";
import { useToast } from "@/context/ToastContext";

export default function SupplierOrdersManagePage() {
    const { showToast } = useToast();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showReassignDialog, setShowReassignDialog] = useState(false);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approveForm, setApproveForm] = useState({
        distributorId: '',
        transporterId: '',
        privateKey: ''
    });
    const [reassignForm, setReassignForm] = useState({
        distributorId: '',
        transporterId: ''
    });
    const [rejectReason, setRejectReason] = useState('');

    const { data: orders, isLoading, error, refetch } = useFetch(
        () => supplierService.getOrders()
    );

    const { data: distributors } = useFetch(
        () => supplierService.getDistributors()
    );

    const { data: transporters } = useFetch(
        () => supplierService.getTransporters()
    );

    const getStatusVariant = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "warning";
            case OrderStatus.APPROVED:
                return "info";
            case OrderStatus.PENDING_REASSIGN:
                return "destructive";
            case OrderStatus.IN_PROGRESS:
                return "info";
            case OrderStatus.DELIVERED:
                return "success";
            case OrderStatus.CANCELLED:
            case OrderStatus.REJECTED:
                return "destructive";
            default:
                return "default";
        }
    };

    const handleApprove = (order: any) => {
        setSelectedOrder(order);
        setApproveForm({ distributorId: '', transporterId: '', privateKey: '' });
        setShowApproveDialog(true);
    };

    const handleReject = (order: any) => {
        setSelectedOrder(order);
        setRejectReason('');
        setShowRejectDialog(true);
    };

    const handleReassign = (order: any) => {
        setSelectedOrder(order);
        setReassignForm({ distributorId: '', transporterId: '' });
        setShowReassignDialog(true);
    };

    const submitApproval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        try {
            setIsSubmitting(true);
            await orderService.approveOrder(selectedOrder.id, {
                distributorId: parseInt(approveForm.distributorId),
                transporterId: parseInt(approveForm.transporterId),
                privateKey: approveForm.privateKey
            });
            showToast("Order approved successfully!", "success");
            setShowApproveDialog(false);
            setApproveForm({ distributorId: '', transporterId: '', privateKey: '' });
            refetch();
        } catch (error: any) {
            console.log('Approval error caught:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to approve order";
            if (errorMessage.toLowerCase().includes('private key') || errorMessage.toLowerCase().includes('invalid key')) {
                showToast("❌ Invalid private key. Please check and try again.", "error");
            } else {
                showToast(errorMessage, "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitRejection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        try {
            setIsSubmitting(true);
            await orderService.rejectOrder(selectedOrder.id, {
                reason: rejectReason
            });
            showToast("Order rejected", "success");
            setShowRejectDialog(false);
            refetch();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to reject order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReassignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        try {
            setIsSubmitting(true);
            await orderService.reassignOrder(selectedOrder.id, {
                distributorId: parseInt(reassignForm.distributorId),
                transporterId: parseInt(reassignForm.transporterId)
            });
            showToast("Order reassigned successfully!", "success");
            setShowReassignDialog(false);
            setReassignForm({ distributorId: '', transporterId: '' });
            refetch();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to reassign order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShip = async (order: any) => {
        if (!confirm('Mark this order as shipped?')) return;

        // Find the LATEST leg that is ACCEPTED and needs shipping
        const latestLeg = order.legs?.reduce((latest: any, leg: any) => 
            !latest || leg.legNumber > latest.legNumber ? leg : latest, 
            null
        );
        
        if (!latestLeg || latestLeg.status !== 'ACCEPTED' || latestLeg.fromType !== 'SUPPLIER') {
            showToast("No accepted leg found to ship", "error");
            return;
        }
        
        const legToShip = latestLeg;

        try {
            setIsSubmitting(true);
            await orderService.shipOrder(order.id, legToShip.id);
            showToast("Order marked as shipped!", "success");
            refetch();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to ship order", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowQR = async (order: any) => {
        setSelectedOrder(order);

        // Generate QR code from the order's qrToken
        if (order.qrToken) {
            const frontendUrl = window.location.origin;
            const verificationUrl = `${frontendUrl}/verify?token=${order.qrToken}`;

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
                setShowQRDialog(true);
            } catch (err) {
                console.error('Error generating QR code:', err);
                showToast('Failed to generate QR code', 'error');
            }
        } else {
            showToast('QR code not available for this order', 'error');
        }
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Please allow popups to print', 'error');
            return;
        }

        const verificationLink = `${window.location.origin}/verify?token=${selectedOrder?.qrToken}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - Order #${selectedOrder?.id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        text-align: center;
                        max-width: 500px;
                    }
                    h1 { margin-bottom: 10px; font-size: 24px; }
                    .order-info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                    .qr-code { margin: 20px 0; }
                    .qr-code img { max-width: 300px; }
                    .instructions { margin-top: 20px; font-size: 14px; color: #666; text-align: left; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Supply Chain Verification</h1>
                    <div class="order-info">
                        <p><strong>Order ID:</strong> #${selectedOrder?.id}</p>
                        <p><strong>Product:</strong> ${selectedOrder?.product?.name}</p>
                        <p><strong>Customer:</strong> ${selectedOrder?.customer?.name}</p>
                        <p><strong>Quantity:</strong> ${selectedOrder?.quantity}</p>
                    </div>
                    <div class="qr-code">
                        <img src="${qrCodeDataUrl}" alt="QR Code" />
                    </div>
                    <div class="instructions">
                        <p><strong>Scan Instructions:</strong></p>
                        <ul>
                            <li>Scan this QR code to verify product authenticity</li>
                            <li>Or visit: ${verificationLink}</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    if (isLoading) {
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
                    <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
                    <p className="text-muted-foreground mt-2">
                        Approve, reject, or reassign customer orders
                    </p>
                </div>

                {/* Orders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order List</CardTitle>
                        <CardDescription>
                            All orders received for your products
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!orders || orders.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-muted-foreground">No orders yet</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Order Status</TableHead>
                                        <TableHead>Leg Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order: any) => {
                                        // Get the active leg (supplier's leg) - exclude rejected legs, get the latest one
                                        const supplierLegs = order.legs?.filter((leg: any) => leg.fromType === 'SUPPLIER') || [];
                                        const activeLeg = supplierLegs.find((leg: any) => leg.status !== 'REJECTED') || supplierLegs[supplierLegs.length - 1];
                                        const legStatus = activeLeg?.status || 'N/A';

                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">#{order.id}</TableCell>
                                                <TableCell>{order.customer?.name || "N/A"}</TableCell>
                                                <TableCell>{order.product?.name || "N/A"}</TableCell>
                                                <TableCell>{order.quantity}</TableCell>
                                                <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        legStatus === 'PENDING' ? 'warning' :
                                                            legStatus === 'ACCEPTED' ? 'info' :
                                                                legStatus === 'IN_TRANSIT' ? 'default' :
                                                                    legStatus === 'DELIVERED' ? 'success' :
                                                                        legStatus === 'REJECTED' ? 'destructive' : 'default'
                                                    }>
                                                        {legStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(order.orderDate)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {order.status === OrderStatus.PENDING && (
                                                            <>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => handleApprove(order)}
                                                                >
                                                                    <Check className="mr-1 h-4 w-4" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleReject(order)}
                                                                >
                                                                    <X className="mr-1 h-4 w-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {order.status === OrderStatus.PENDING_REASSIGN && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleReassign(order)}
                                                            >
                                                                <RefreshCw className="mr-1 h-4 w-4" />
                                                                Reassign
                                                            </Button>
                                                        )}
                                                        {order.status === OrderStatus.APPROVED && (() => {
                                                            // Only show Ship button if the LATEST leg is ACCEPTED and from SUPPLIER
                                                            const latestLeg = order.legs?.reduce((latest: any, leg: any) => 
                                                                !latest || leg.legNumber > latest.legNumber ? leg : latest, 
                                                                null
                                                            );
                                                            return latestLeg?.status === 'ACCEPTED' && latestLeg?.fromType === 'SUPPLIER';
                                                        })() && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleShip(order)}
                                                                disabled={isSubmitting}
                                                            >
                                                                <Truck className="mr-1 h-4 w-4" />
                                                                Ship
                                                            </Button>
                                                        )}
                                                        {/* Show QR button after order is shipped (IN_TRANSIT) */}
                                                        {order.status === OrderStatus.APPROVED && (() => {
                                                            const latestLeg = order.legs?.reduce((latest: any, leg: any) => 
                                                                !latest || leg.legNumber > latest.legNumber ? leg : latest, 
                                                                null
                                                            );
                                                            return latestLeg?.status === 'IN_TRANSIT' && latestLeg?.fromType === 'SUPPLIER' && order.qrToken;
                                                        })() && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleShowQR(order)}
                                                            >
                                                                <Printer className="mr-1 h-4 w-4" />
                                                                QR Code
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Approve Order Dialog */}
                <Dialog open={showApproveDialog} onClose={() => setShowApproveDialog(false)}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Approve Order</h2>
                        {selectedOrder && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Order #{selectedOrder.id}</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">Customer: <span className="font-medium">{selectedOrder.customer?.name}</span></p>
                                    <p className="text-gray-600">Product: <span className="font-medium">{selectedOrder.product?.name}</span></p>
                                    <p className="text-gray-600">Quantity: <span className="font-medium">{selectedOrder.quantity}</span></p>
                                    <p className="text-gray-600">Total: <span className="font-medium text-lg">{formatCurrency(selectedOrder.totalAmount)}</span></p>
                                    <p className="text-gray-600">Delivery: <span className="font-medium">{selectedOrder.deliveryAddress}</span></p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={submitApproval} className="space-y-4">
                            <div>
                                <Label htmlFor="distributor">Select Distributor *</Label>
                                <select
                                    id="distributor"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={approveForm.distributorId}
                                    onChange={(e) => setApproveForm({ ...approveForm, distributorId: e.target.value })}
                                    required
                                >
                                    <option value="" className="text-gray-500">Choose a distributor</option>
                                    {distributors?.map((dist: any) => (
                                        <option key={dist.id} value={dist.id} className="text-gray-900">
                                            {dist.businessName} - {dist.user?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="transporter">Select Transporter *</Label>
                                <select
                                    id="transporter"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={approveForm.transporterId}
                                    onChange={(e) => setApproveForm({ ...approveForm, transporterId: e.target.value })}
                                    required
                                >
                                    <option value="" className="text-gray-500">Choose a transporter</option>
                                    {transporters?.map((trans: any) => (
                                        <option key={trans.id} value={trans.id} className="text-gray-900">
                                            {trans.name} - {trans.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="privateKey">Private Key *</Label>
                                <Textarea
                                    id="privateKey"
                                    placeholder="Paste your private key here (including BEGIN and END lines)"
                                    value={approveForm.privateKey}
                                    onChange={(e) => setApproveForm({ ...approveForm, privateKey: e.target.value })}
                                    required
                                    rows={6}
                                    className="font-mono text-xs"
                                />
                                <p className="text-xs text-gray-500 mt-1">Required for order verification and digital signature</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Approving...' : 'Approve Order'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowApproveDialog(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog>

                {/* Reject Order Dialog */}
                <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reject Order</h2>
                        {selectedOrder && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Order #{selectedOrder.id}</h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">Customer: <span className="font-medium">{selectedOrder.customer?.name}</span></p>
                                    <p className="text-gray-600">Product: <span className="font-medium">{selectedOrder.product?.name}</span></p>
                                    <p className="text-gray-600">Quantity: <span className="font-medium">{selectedOrder.quantity}</span></p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={submitRejection} className="space-y-4">
                            <div>
                                <Label htmlFor="reason">Rejection Reason *</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please provide a reason for rejecting this order"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    required
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                                    {isSubmitting ? 'Rejecting...' : 'Reject Order'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowRejectDialog(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog>

                {/* Reassign Order Dialog */}
                <Dialog open={showReassignDialog} onClose={() => setShowReassignDialog(false)}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reassign Order</h2>
                        {selectedOrder && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Order #{selectedOrder.id}</h3>
                                <p className="text-sm text-amber-800 mb-3">Previous distributor rejected this order. Please assign a new distributor.</p>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">Customer: <span className="font-medium">{selectedOrder.customer?.name}</span></p>
                                    <p className="text-gray-600">Product: <span className="font-medium">{selectedOrder.product?.name}</span></p>
                                    <p className="text-gray-600">Quantity: <span className="font-medium">{selectedOrder.quantity}</span></p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={submitReassignment} className="space-y-4">
                            <div>
                                <Label htmlFor="reassign-distributor">Select New Distributor *</Label>
                                <select
                                    id="reassign-distributor"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={reassignForm.distributorId}
                                    onChange={(e) => setReassignForm({ ...reassignForm, distributorId: e.target.value })}
                                    required
                                >
                                    <option value="" className="text-gray-500">Choose a distributor</option>
                                    {distributors?.map((dist: any) => (
                                        <option key={dist.id} value={dist.id} className="text-gray-900">
                                            {dist.businessName} - {dist.user?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="reassign-transporter">Select Transporter *</Label>
                                <select
                                    id="reassign-transporter"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={reassignForm.transporterId}
                                    onChange={(e) => setReassignForm({ ...reassignForm, transporterId: e.target.value })}
                                    required
                                >
                                    <option value="" className="text-gray-500">Choose a transporter</option>
                                    {transporters?.map((trans: any) => (
                                        <option key={trans.id} value={trans.id} className="text-gray-900">
                                            {trans.name} - {trans.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Reassigning...' : 'Reassign Order'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowReassignDialog(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog>

                {/* QR Code Dialog */}
                <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Package QR Code</h2>
                        {selectedOrder && (
                            <div className="space-y-4">
                                {/* Order Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-lg mb-3 text-gray-900">Order #{selectedOrder.id}</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Product:</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.product?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Quantity:</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Customer:</p>
                                            <p className="font-semibold text-gray-900">{selectedOrder.customer?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Total Amount:</p>
                                            <p className="font-semibold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col items-center py-4">
                                    {qrCodeDataUrl ? (
                                        <>
                                            <img
                                                src={qrCodeDataUrl}
                                                alt="QR Code"
                                                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                                            />
                                            <p className="text-sm text-gray-600 mt-3 text-center">
                                                Distributor/Customer scans this code to verify authenticity
                                            </p>

                                            {/* Verification Link */}
                                            <div className="w-full mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Verification Link:</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${window.location.origin}/verify?token=${selectedOrder.qrToken}`}
                                                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded text-gray-700 font-mono"
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/verify?token=${selectedOrder.qrToken}`);
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
                                    <Button onClick={handlePrintQR} className="flex-1">
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
