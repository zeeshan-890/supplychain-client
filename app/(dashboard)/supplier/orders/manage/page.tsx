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

        // Find the first leg that is ACCEPTED and needs shipping
        const legToShip = order.legs?.find((leg: any) => leg.status === 'ACCEPTED' && leg.fromType === 'SUPPLIER');

        if (!legToShip) {
            showToast("No accepted leg found to ship", "error");
            return;
        }

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
                                                        {order.status === OrderStatus.APPROVED && order.legs?.some((leg: any) => leg.status === 'ACCEPTED' && leg.fromType === 'SUPPLIER') && (
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
            </div>
        </Container>
    );
}
