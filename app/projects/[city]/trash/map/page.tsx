"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";;
import { LatLngTuple } from "leaflet";
import PageTitle from "@/components/PageTitle";
import Map from "@/components/Map";
import LoadingComponent from "@/components/LoadingComponent";
import { Trashbin } from "@/app/types";
import { useTranslation } from "@/lib/TranslationContext";


const MapPage = () => {
  const { t } = useTranslation(); // Translation hook
  const router = useRouter();
  const [trashbinData, setTrashbinData] = useState<Trashbin[]>([]);
  const [centerCoordinates, setCenterCoordinates] = useState<LatLngTuple | null>(null);
  const [initialZoom, setInitialZoom] = useState<number | null>(null);
  const [fillThresholds, setFillThresholds] = useState<[number, number] | null>(null);
  const [batteryThresholds, setBatteryThresholds] = useState<[number, number] | null>(null);

  const redirectToTrashbinDetail = (trashbin: any) => {
    const city = localStorage.getItem("cityName");
    const type = localStorage.getItem("projectType");
    router.push(`/projects/${city}/${type}/trashbins/${trashbin.identifier}`);
    return false;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const projectId = localStorage.getItem("projectId");

        const trashbinResponse = await axios.get(
          `/api/v1/trashbin?project=${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        setTrashbinData(trashbinResponse.data.trashbins);

        const projectResponse = await axios.get(
          `/api/v1/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        setInitialZoom(projectResponse.data.project.initialZoom);
        setCenterCoordinates(projectResponse.data.project.centerCoords);
        setFillThresholds(projectResponse.data.project.preferences.fillThresholds);
        setBatteryThresholds(projectResponse.data.project.preferences.batteryThresholds);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        }
      }
    };
    fetchData();
  }, [router]);

  return (
    <div className="flex flex-col h-[90vh]">
      <div className="pb-2">
        {/* Translated title */}
        <PageTitle title={t("menu.map")} />
      </div>
      {/* Make sure that all information was fetched from the backend before rendering the map */}
      
      { (centerCoordinates && initialZoom && fillThresholds && batteryThresholds) ?
        <Map
          trashbinData={trashbinData}
          centerCoordinates={centerCoordinates}
          initialZoom={initialZoom}
          fillThresholds={fillThresholds}
          batteryThresholds={batteryThresholds}
          isRoutePlanning={false}
          onTrashbinClick={redirectToTrashbinDetail}
        />
       : (
        <LoadingComponent text={t("menu.loading_map")} />    )}
    </div>
  );
};

export default MapPage;
