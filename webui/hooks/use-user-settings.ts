"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface UseUserSettingsReturn {
  updateSetting: (setting: string, value: boolean | number | string) => Promise<boolean>;
  isUpdating: (setting: string) => boolean;
  getError: (setting: string) => string | null;
  clearError: (setting: string) => void;
}

export function useUserSettings(): UseUserSettingsReturn {
  const { user, refreshUser } = useAuth();
  const [updatingSettings, setUpdatingSettings] = useState<Set<string>>(new Set());
  const [settingErrors, setSettingErrors] = useState<Record<string, string>>({});

  const updateSetting = useCallback(async (setting: string, value: boolean | number | string): Promise<boolean> => {
    if (!user) return false;

    setUpdatingSettings(prev => new Set(prev).add(setting));
    setSettingErrors(prev => ({ ...prev, [setting]: '' }));

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [setting]: value }),
        credentials: 'include'
      });

      if (response.ok) {
        await refreshUser();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSettingErrors(prev => ({
          ...prev,
          [setting]: errorData.message || 'Failed to update setting'
        }));
        return false;
      }
    } catch (error) {
      console.error('[!] Error updating setting:', error);
      setSettingErrors(prev => ({
        ...prev,
        [setting]: error instanceof Error ? error.message : 'Network error'
      }));
      return false;
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(setting);
        return newSet;
      });
    }
  }, [user, refreshUser]);

  const isUpdating = useCallback((setting: string): boolean => {
    return updatingSettings.has(setting);
  }, [updatingSettings]);

  const getError = useCallback((setting: string): string | null => {
    return settingErrors[setting] || null;
  }, [settingErrors]);

  const clearError = useCallback((setting: string): void => {
    setSettingErrors(prev => ({ ...prev, [setting]: '' }));
  }, []);

  return {
    updateSetting,
    isUpdating,
    getError,
    clearError
  };
}