"use client";

import PageTitle from "@/components/PageTitle";
import Card, { CardContent, CardProps } from "@/components/Card";
import { HeatmapFillLevel } from "@/components/Heatmap/HeatmapFillLevel";
import { Trashbin } from "@/app/types";
import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";;
import { useTranslation } from "@/lib/TranslationContext"; // Import the translation hook
import { redirect } from "next/navigation";

interface HistoryDataItem {
  timestamp: Date;
  fillLevel: number;
  batteryLevel: number;
}

// Bins currently always assigned to a single collector
// Treated like a boolean for now: assigned or not assigned

export default function Home() {
  const { t } = useTranslation(); // Translation hook
  const [trashbinData, setTrashbinData] = useState<Trashbin[]>([]);
  const [totalCardData, setTotalCardData] = useState<CardProps>({
    label: "",
    amount: "0",
    description: "",
  });
  const [nearlyFullCardData, setNearlyFullCardData] = useState<CardProps>({
    label: "",
    amount: "0",
    description: "",
  });
  const [lowBatteryCardData, setLowBatteryCardData] = useState<CardProps>({
    label: "",
    amount: "0",
    description: "",
  });
  const [brokenSensorsCardData, setBrokenSensorsCardData] = useState<CardProps>({
    label: "",
    amount: "0",
    description: "",
  });

  useEffect(() => {
    // Update card data when translations are loaded
    setTotalCardData((prev) => ({
      ...prev,
      label: t("menu.total_number"),
    }));
    setNearlyFullCardData((prev) => ({
      ...prev,
      label: t("menu.nearly_full"),
    }));
    setLowBatteryCardData((prev) => ({
      ...prev,
      label: t("menu.low_battery"),
    }));
    setBrokenSensorsCardData((prev) => ({
      ...prev,
      label: t("menu.broken_sensors"),
    }));
  }, [t]);

 useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const projectId = localStorage.getItem("projectId");

      if (!token || !projectId) {
        console.error("Token or Project ID is missing");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token?.replace(/"/g, "")}`,
      };

      // Fetch all trashbins
      const allTrashbinsResponse = await axios.get(
        `/api/v1/trashbin?project=${projectId}`,
        { headers }
      );
      const transformedTrashbinData: Trashbin[] = allTrashbinsResponse.data.trashbins || [];

      // Fetch assigned trashbins
      const assignedTrashbinsResponse = await axios.get(
        `/api/v1/trashbin?project=${projectId}`,
        { headers }
      );
      const assignedTrashbins = assignedTrashbinsResponse.data.assignedTrashbins || [];
      
      if (!Array.isArray(transformedTrashbinData) || !Array.isArray(assignedTrashbins)) {
        throw new Error("Unexpected response structure");
      }

      // Map the assigned status
      const updatedTrashbinData = transformedTrashbinData.map((item: Trashbin) => ({
        ...item,
        assigned: assignedTrashbins.map((bin: Trashbin) => bin._id).includes(item._id),
      }));

      setTrashbinData(updatedTrashbinData);

      setTotalCardData((prev) => ({
        ...prev,
        amount: updatedTrashbinData.length.toString(),
      }));

      // Fetch project preferences
      const projectResponse = await axios.get(
        `/api/v1/project/${projectId}`,
        { headers }
      );

      const { fillThresholds, batteryThresholds } = projectResponse.data.project.preferences;

      setNearlyFullCardData((prev) => {
        const count = updatedTrashbinData.reduce(
          (acc, item) => (item.fillLevel > fillThresholds[1] ? acc + 1 : acc),
          0
        );
        return { ...prev, amount: count.toString() };
      });

      setLowBatteryCardData((prev) => {
        const count = updatedTrashbinData.reduce(
          (acc, item) => (item.batteryLevel < batteryThresholds[1] ? acc + 1 : acc),
          0
        );
        return { ...prev, amount: count.toString() };
      });

      setBrokenSensorsCardData((prev) => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const count = updatedTrashbinData.filter(
          (item) => new Date(item.updatedAt) < threeDaysAgo
        ).length;
        return { ...prev, amount: count.toString() };
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        redirect('/login');
      }
    }
  };

  fetchData();
}, []);


  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Translated title */}
      <PageTitle title={t("menu.dashboard")} />
      <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-1">
        <CardContent>
          <p className="p-4 text-xl font-semibold">
            {t("menu.Distribution of fill levels of all bins")}
          </p>
          <HeatmapFillLevel trashbins={trashbinData} />
        </CardContent>
      </section>
      <section className="grid w-full grid-cols-1 gap-4 gap-x-8 transition-all sm:grid-cols-2 xl:grid-cols-4">
  {[totalCardData, nearlyFullCardData, lowBatteryCardData, brokenSensorsCardData].map(
    (cardData, index) => (
      <Card
        key={index}
        amount={cardData.amount}
        description={cardData.description}
        label={cardData.label}
      />
    )
  )}
</section>

    </div>
  );
}
