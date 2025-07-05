"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";

export default function DeleteAccountPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Your account has been deleted. You will now be redirected to the home page. Thanks for using Kowalski!');
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(`Failed to delete account: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setIsDeleting(false);
      setDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="w-full h-full bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/account">
                <ArrowLeft className="w-4 h-4" />
                Back to Account
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Delete Account</h1>
                <p className="text-muted-foreground">Permanently remove your account and data</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    This action cannot be undone
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Deleting your account will permanently remove all your data, including:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1 ml-2">
                    <li>Your user profile and settings</li>
                    <li>AI usage statistics and request history</li>
                    <li>Custom AI model preferences</li>
                    <li>Command configuration and disabled commands</li>
                    <li>All associated sessions and authentication data</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">@{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telegram ID:</span>
                  <span className="font-medium">{user?.telegramId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Requests:</span>
                  <span className="font-medium">{user?.aiRequests.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ready to delete your account?</h3>
                  <p className="text-sm text-muted-foreground">
                    This will immediately and permanently delete your account.
                  </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Confirm Account Deletion
                      </DialogTitle>
                      <DialogDescription className="space-y-2">
                        <p>
                          Are you absolutely sure you want to delete your account? This action cannot be undone.
                        </p>
                        <p className="font-medium">
                          Your account <span className="font-bold">@{user?.username}</span> and all associated data will be permanently removed.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Yes, Delete Account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
