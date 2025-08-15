"use client";

import Image from "next/image";
import USFlag from "../assets/flags/en.webp";
import BRFlag from "../assets/flags/br.svg";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

export function LanguageChooser() {
    const { i18n } = useTranslation();
    const { user, refreshUser } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleLanguageChange = async (value: string) => {
        i18n.changeLanguage(value);
        localStorage.setItem('kowalski-language', value);

        if (user && !isUpdating) {
            setIsUpdating(true);
            try {
                const sessionToken = localStorage.getItem('kowalski-session');
                const response = await fetch('/api/user/settings', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        languageCode: value === 'pt' ? 'portuguese' : value
                    })
                });

                if (response.ok) {
                    await refreshUser();
                }
            } catch (error) {
                console.error('Failed to update language preference:', error);
            } finally {
                setIsUpdating(false);
            }
        }
    };

    useEffect(() => {
        if (user?.languageCode) {
            const lang = user.languageCode === 'portuguese' ? 'pt' : user.languageCode;
            if (i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }
        }
    }, [user, i18n]);

    return (
        <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Image src={USFlag} alt="English" width={20} height={20} />
                    </div>
                    English
                </SelectItem>
                <SelectItem value="pt" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Image src={BRFlag} alt="Portuguese" width={20} height={20} />
                    </div>
                    Português
                </SelectItem>
            </SelectContent>
        </Select>
    );
}