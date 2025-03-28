"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/TranslationContext"; // Import translation hook


function removeLocalData() {
  if (typeof window !== "undefined") {
    localStorage.clear();
  }
}

export default function Component() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();
  const { t } = useTranslation(); // Use translation hook for localization


  removeLocalData();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `/api/v1/auth/login`,
        {
          name,
          password,
        }
      );

      if (response.status === 200) {
        // Save the token in local storage for future requests
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("name", name);
        localStorage.setItem("userId", response.data.user.id);
        
        // Redirect to the home page
        router.push("/");
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "An error occurred");
      setTimeout(() => {
        setErrorMessage(null);
      }, 2000);
      // Set the focus to the name input field
      document.getElementById("name")?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    handleLogin(); // Trigger login function explicitly
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Simulate a button click by triggering the handleLogin function
      handleLogin();
    }
  };

    return (
      <div className="min-h-screen flex justify-center items-center">
        <Card className="mx-auto max-w-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {t("login.title")}
              </CardTitle>
              <CardDescription>
                {t("login.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorMessage && (
                  <div className="p-2 text-red-500 bg-red-100 rounded">
                    {errorMessage}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">{t("login.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("login.emailPlaceholder")}
                    required
                    type="name"
                    value={name}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input
                    id="password"
                    placeholder={t("login.passwordPlaceholder")}
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <Button
                  className="w-full"
                  type="button"
                  onClick={handleLogin}
                >
                  {t("login.loginButton")}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }
