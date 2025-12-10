"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import Container from "@/components/layout/Container";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { userService } from "@/services/userService";

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        phone: (user as any)?.phone || "",
        address: (user as any)?.address || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user) return null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const response = await userService.updateUser(formData);
            // Update user in context after successful API call
            if (response.user) {
                setUser({ ...user, ...response.user });
            }
            showToast("Profile updated successfully!", "success");
            setIsEditing(false);
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user.name,
            phone: (user as any).phone || "",
            address: (user as any).address || "",
        });
        setIsEditing(false);
    };

    return (
        <Container>
            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account information
                    </p>
                </div>

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{user.name}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                    <div className="flex gap-2 mt-2">
                                        {user.role && (
                                            <Badge variant="default">
                                                {user.role}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email (Read-only) */}
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                {isEditing ? (
                                    <Input
                                        label="Name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Name</p>
                                        <p className="font-medium">{user.name}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                {isEditing ? (
                                    <Input
                                        label="Phone"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{(user as any).phone || "Not provided"}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                {isEditing ? (
                                    <Input
                                        label="Address"
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                    />
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Address</p>
                                        <p className="font-medium">{(user as any).address || "Not provided"}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Edit Actions */}
                        {isEditing && (
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={handleCancel}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} isLoading={isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>
                            Additional account details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">User ID</p>
                                <p className="font-medium">#{user.id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
