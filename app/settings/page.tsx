"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import PageTitle from '@/components/PageTitle';
import { useTranslation } from '@/lib/TranslationContext';
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { CardContent, Card, CardHeader } from "@/components/ui/card";
// import { Sun, Moon } from "lucide-react";
// import { useTheme } from "next-themes";  // https://github.com/pacocoursey/next-themes

export default function Component() {
  const { t } = useTranslation(); // Use translation hook for localization
  const handleLogout = () => {
    window.location.href = '/login';      // Redirect to the login page (where the authToken is cleared)
  }

  // TODO: Make it more robust by fetching the name by API, not storing it in local storage
  const getEmail = (): string => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('name'); // Safe to use localStorage here
      if (name) return name;
    }
    return 'name';
  };

  return (
    <div>
      <div className="px-4 space-y-6 sm:px-6">
        <PageTitle title={getEmail()} />
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-[150px]"
        >
          {t("page.logout")}
        </Button>
        <p className="text-sm text-gray-500 text-center select-none">
          {t("page.comingSoon")}
        </p>
        {/* <Card>
          <CardHeader>
            <div>
              <h2>{t("page.language.title")}</h2>
              <p>{t("page.language.description")}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid w-[20rem] grid-cols-2 gap-2 rounded-xl bg-gray-200 p-2">
              <div>
                <input
                  type="radio"
                  name="option"
                  id="de"
                  value="de"
                  className="peer hidden"
                  checked={language === "de"}
                  onChange={() => setLanguage("de")}
                />
                <label
                  htmlFor="de"
                  className="block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-blue-500 peer-checked:font-bold peer-checked:text-white"
                >
                  {t("page.language.german")}
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  name="option"
                  id="en"
                  value="en"
                  className="peer hidden"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                />
                <label
                  htmlFor="en"
                  className="block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-blue-500 peer-checked:font-bold peer-checked:text-white"
                >
                  {t("page.language.english")}
                </label>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}

