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
import { useTranslation } from "react-i18next";

export default function DeleteAccountPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert(t('deleteAccount.successMessage'));
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(`${t('deleteAccount.failedToDelete')}: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(t('deleteAccount.errorOccurred'));
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
                {t('deleteAccount.backToAccount')}
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('deleteAccount.title')}</h1>
                <p className="text-muted-foreground">{t('deleteAccount.subtitle')}</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {t('deleteAccount.cannotBeUndone')}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {t('deleteAccount.deletingWillRemove')}
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1 ml-2">
                    <li>{t('deleteAccount.yourProfile')}</li>
                    <li>{t('deleteAccount.aiUsageStats')}</li>
                    <li>{t('deleteAccount.customAiPreferences')}</li>
                    <li>{t('deleteAccount.commandConfiguration')}</li>
                    <li>{t('deleteAccount.allSessions')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('deleteAccount.accountInformation')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deleteAccount.username')}:</span>
                  <span className="font-medium">@{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deleteAccount.name')}:</span>
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deleteAccount.telegramId')}:</span>
                  <span className="font-medium">{user?.telegramId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deleteAccount.aiRequests')}:</span>
                  <span className="font-medium">{user?.aiRequests.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{t('deleteAccount.readyToDelete')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('deleteAccount.thisWillImmediately')}
                  </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t('deleteAccount.title')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        {t('deleteAccount.confirmDeletion')}
                      </DialogTitle>
                      <DialogDescription className="space-y-2">
                        <p>
                          {t('deleteAccount.areYouSure')}
                        </p>
                        <p className="font-medium">
                          {t('deleteAccount.yourAccountWillBeRemoved', { username: user?.username })}
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={isDeleting}
                      >
                        {t('account.cancel')}
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
                            {t('deleteAccount.deleting')}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            {t('deleteAccount.yesDeleteAccount')}
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
