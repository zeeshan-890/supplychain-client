"use client";

import { useState } from "react";
import { QrCode, Camera, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import Container from "@/components/layout/Container";
import { verificationService } from "@/services/verificationService";
import { Spinner } from "@/components/ui/Spinner";

export default function VerifyQRPage() {
    const [qrData, setQrData] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!qrData) {
            setError("Please enter QR code data");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const data = await verificationService.verifyQR(qrData);
            setResult(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleScanQR = () => {
        // In a real app, this would open camera and use qr-scanner library
        alert("QR Scanner would open here. For demo, paste QR data manually.");
    };

    return (
        <Container>
            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">QR Code Verification</h1>
                    <p className="text-muted-foreground mt-2">
                        Verify product authenticity using QR codes
                    </p>
                </div>

                {/* Verification Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scan or Enter QR Code</CardTitle>
                        <CardDescription>
                            Verify the authenticity of your product
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter QR code data or scan"
                                value={qrData}
                                onChange={(e) => setQrData(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                            />
                            <Button variant="outline" onClick={handleScanQR}>
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleVerify}
                            isLoading={loading}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Verify QR Code
                        </Button>

                        {error && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Verification Failed</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {result && (
                            <Alert variant={result.valid ? "success" : "destructive"}>
                                {result.valid ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>
                                    {result.valid ? "Authentic Product" : "Invalid Product"}
                                </AlertTitle>
                                <AlertDescription>
                                    {result.message}
                                    {result.data && (
                                        <div className="mt-4 space-y-2">
                                            <p><strong>Product:</strong> {result.data.productName}</p>
                                            <p><strong>Order ID:</strong> #{result.data.orderId}</p>
                                            <p><strong>Quantity:</strong> {result.data.quantity} units</p>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Scan the QR Code</p>
                                <p className="text-muted-foreground">
                                    Use your camera or paste the QR data
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                2
                            </div>
                            <div>
                                <p className="font-medium">Instant Verification</p>
                                <p className="text-muted-foreground">
                                    Our system validates the digital signature
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                3
                            </div>
                            <div>
                                <p className="font-medium">Get Results</p>
                                <p className="text-muted-foreground">
                                    See product details and authenticity status
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
