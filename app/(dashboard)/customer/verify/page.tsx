"use client";

import { useState } from "react";
import { QrCode, CheckCircle, XCircle, AlertCircle, Package, Building2, Calendar, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Container from "@/components/layout/Container";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/context/ToastContext";
import { verificationService, QRVerificationResult } from "@/services/verificationService";

export default function VerifyProductPage() {
    const { showToast } = useToast();
    const [token, setToken] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<QRVerificationResult | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    const handleVerify = async (qrToken?: string) => {
        const tokenToVerify = qrToken || token;

        if (!tokenToVerify.trim()) {
            showToast("Please enter a QR token or scan a QR code", "error");
            return;
        }

        try {
            setIsVerifying(true);
            setVerificationResult(null);
            const result = await verificationService.verifyQR(tokenToVerify);
            setVerificationResult(result);

            if (result.valid) {
                showToast("Product verified successfully!", "success");
            } else {
                showToast(result.message || "Product verification failed", "error");
            }
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            showToast(error.response?.data?.message || "Failed to verify product", "error");
            setVerificationResult({
                valid: false,
                message: "Verification failed",
                error: error.response?.data?.message || "An error occurred"
            });
        } finally {
            setIsVerifying(false);
            setShowScanner(false);
        }
    };

    const handleReset = () => {
        setToken("");
        setVerificationResult(null);
        setShowScanner(false);
    };

    return (
        <Container>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Verify Product</h1>
                    <p className="text-muted-foreground mt-2">
                        Scan QR code or enter token to verify product authenticity
                    </p>
                </div>

                {/* Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Product Verification</CardTitle>
                        <CardDescription>
                            Use the QR scanner or manually enter the verification token
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!showScanner ? (
                            <>
                                {/* Manual Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">QR Token</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter QR token..."
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            disabled={isVerifying}
                                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                        />
                                        <Button
                                            onClick={() => handleVerify()}
                                            disabled={isVerifying || !token.trim()}
                                        >
                                            {isVerifying ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                "Verify"
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Scanner Button */}
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex-1 border-t"></div>
                                    <span className="text-sm text-muted-foreground">OR</span>
                                    <div className="flex-1 border-t"></div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowScanner(true)}
                                    disabled={isVerifying}
                                >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Scan QR Code
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* QR Scanner Placeholder */}
                                <div className="space-y-3">
                                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                                        <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-sm text-muted-foreground">
                                            QR Scanner feature requires camera permissions.
                                            <br />
                                            Please use manual token entry for now.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowScanner(false)}
                                    >
                                        Back to Manual Entry
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Reset Button */}
                        {verificationResult && (
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleReset}
                            >
                                Verify Another Product
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Verification Result */}
                {verificationResult && (
                    <Card className={verificationResult.valid ? "border-green-500" : "border-red-500"}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                {verificationResult.valid ? (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                        <XCircle className="h-6 w-6 text-red-500" />
                                    </div>
                                )}
                                <div>
                                    <CardTitle className={verificationResult.valid ? "text-green-500" : "text-red-500"}>
                                        {verificationResult.valid ? "Product is Authentic" : "Verification Failed"}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {verificationResult.message}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Valid Product Details */}
                        {verificationResult.valid && verificationResult.order && (
                            <CardContent className="space-y-6">
                                {/* Product Information */}
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Product Information
                                    </h3>
                                    <div className="space-y-2 pl-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Product Name</span>
                                            <span className="font-medium">{verificationResult.order.product.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Category</span>
                                            <Badge variant="outline">{verificationResult.order.product.category}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Batch Number</span>
                                            <span className="font-mono text-sm">{verificationResult.order.product.batchNo}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Information */}
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Order Information
                                    </h3>
                                    <div className="space-y-2 pl-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Order ID</span>
                                            <span className="font-mono text-sm">#{verificationResult.order.id}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Order Date</span>
                                            <span className="text-sm flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(verificationResult.order.orderDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            <Badge variant="success">{verificationResult.order.status}</Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Supplier Information */}
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Supplier Information
                                    </h3>
                                    <div className="space-y-2 pl-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Business Name</span>
                                            <span className="font-medium">{verificationResult.order.supplier.businessName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Details */}
                                {verificationResult.verification && (
                                    <div className="border-t pt-6">
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Verification Details
                                        </h3>
                                        <div className="space-y-2 pl-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Signed At</span>
                                                <span className="text-sm">
                                                    {new Date(verificationResult.verification.signedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Supplier Signature</span>
                                                <Badge variant={verificationResult.verification.supplierSignatureValid ? "success" : "destructive"}>
                                                    {verificationResult.verification.supplierSignatureValid ? "Valid" : "Invalid"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Server Signature</span>
                                                <Badge variant={verificationResult.verification.serverSignatureValid ? "success" : "destructive"}>
                                                    {verificationResult.verification.serverSignatureValid ? "Valid" : "Invalid"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}

                        {/* Invalid Product Message */}
                        {!verificationResult.valid && verificationResult.error && (
                            <CardContent>
                                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-500">Verification Error</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {verificationResult.error}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Info Card */}
                {!verificationResult && (
                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-blue-500">How to verify your product</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        <li>Scan the QR code on your product package using the scanner</li>
                                        <li>Or manually enter the verification token from the package</li>
                                        <li>The system will verify the product&apos;s authenticity with digital signatures</li>
                                        <li>You&apos;ll see detailed information if the product is authentic</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Container>
    );
}
