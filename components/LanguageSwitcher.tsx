import React from "react";
import { useTranslation } from "../lib/TranslationContext";
import { GlobeIcon } from "lucide-react"; // Import Globe icon
import axios from "axios"; // Import Axios for API calls

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = async () => {
    // Determine the new language
    const newLanguage = language === "en" ? "de" : "en";
  
    try {
      // Retrieve the token and project ID from localStorage
      const token = localStorage.getItem("authToken");
      const projectId = localStorage.getItem("projectId");
      const userId = localStorage.getItem("userId");
      
  
      if (!token || !projectId) {
        console.error("Token or Project ID is missing");
        return;
      }
  
      // Set up headers for the API request
      const headers = {
        Authorization: `Bearer ${token.replace(/"/g, "")}`, // Remove quotes if present
        "Content-Type": "application/json",
      };
  
      // Make the PATCH request to update the user's preferences
      const response = await axios.patch(
        "/api/v1/auth/user",
        {
          userId: userId, // Replace with dynamic user ID if available
          preferences: {
            language: newLanguage.toUpperCase(), // Send "EN" or "DE"
            themeIsDark: true, // Assuming this value is fixed; replace if dynamic
          },
        },
        { headers }
      );
      // Update the local state after a successful API call
      setLanguage(newLanguage);
    } catch (error: any) {
      console.error(
        "Error updating language preference:",
        error.response?.data || error.message
      );
    }
  };
  

  return (
    <div className="language-switcher-container">
      <div
        className="icon-button"
        onClick={toggleLanguage}
        title={`Switch to ${language === "en" ? "German" : "English"}`} // Tooltip for accessibility
      >
        <GlobeIcon className="h-6 w-6 text-gray-600" />
      </div>
    </div>
  );
}
