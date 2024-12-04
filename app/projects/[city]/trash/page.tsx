"use client";

import PageTitle from "@/components/PageTitle";
import Card, { CardContent, CardProps } from "@/components/Card";
import { HeatmapFillLevel } from "@/components/Heatmap/HeatmapFillLevel";
import { Trashbin } from "@/app/types";
import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "@/lib/TranslationContext"; // Import the translation hook

interface HistoryDataItem {
  timestamp: Date;
  fillLevel: number;
  batteryLevel: number;
}

// Bins currently always assigned to a single collector
// Treated like a boolean for now: assigned or not assigned
const COLLECTOR_ID = "673b10d6f0e74b4771527ec9";

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

        const allTrashbinsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/trashbin?project=${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        let transformedTrashbinData: Trashbin[] = allTrashbinsResponse.data.trashbins;

        // Get the currently assigned bins
        const assignedTrashbinsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/trash-collector/${COLLECTOR_ID}/trashbins`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        const assignedTrashbins = assignedTrashbinsResponse.data.assignedTrashbins.map(
          (item: Trashbin) => item._id
        );

        // Set the assigned property for each trashbin to true, if its id is in the assignedTrashbins array
        transformedTrashbinData = transformedTrashbinData.map((item: Trashbin) => ({
          ...item,
          assigned: assignedTrashbins.includes(item._id),
        }));
        setTrashbinData(transformedTrashbinData);

        setTotalCardData((prev) => ({
          ...prev,
          amount: transformedTrashbinData.length.toString(),
        }));

        const projectResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        setNearlyFullCardData((prev) => {
          const count = transformedTrashbinData.reduce(
            (acc, item) =>
              item.fillLevel > projectResponse.data.project.preferences.fillThresholds[1]
                ? acc + 1
                : acc,
            0
          );
          return { ...prev, amount: count.toString() };
        });

        setLowBatteryCardData((prev) => {
          const count = transformedTrashbinData.reduce(
            (acc, item) =>
              item.batteryLevel < projectResponse.data.project.preferences.batteryThresholds[1]
                ? acc + 1
                : acc,
            0
          );
          return { ...prev, amount: count.toString() };
        });

        setBrokenSensorsCardData((prev) => {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const count = transformedTrashbinData.filter(
            (item) => new Date(item.updatedAt) < oneWeekAgo
          ).length;
          return { ...prev, amount: count.toString() };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
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
