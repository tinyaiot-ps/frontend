"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import LoadingComponent from "@/components/LoadingComponent";
import { Info } from "lucide-react";
import {useTranslation} from '@/lib/TranslationContext'


export default function ProjectSettings() {
  const [mapCenterCoordinates, setMapCenterCoordinates] = useState<[string, string]>(["0", "0"]);
  const [startEndCoordinates, setStartEndCoordinates] = useState<[string, string]>(["0", "0"]);
  const [zoomLevel, setZoomLevel] = useState<string>("0");
  const [fillLevelInterval, setFillLevelInterval] = useState<string>("0");
  const [fillThresholds, setFillThresholds] = useState<[string, string]>(["0", "0"]);
  const [batteryThresholds, setBatteryThresholds] = useState<[string, string]>(["0", "0"]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(false);
  const [errors, setErrors] = useState({ mapCenter: "", startEnd: "", zoomLevel: "", fillLevelInterval: "", fillThresholds: "", batteryThresholds: ""});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const projectId = localStorage.getItem("projectId");

        const projectResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        const { centerCoords, startEndCoords, initialZoom, preferences, fillLevelChangeHours } =
          projectResponse.data.project;

        setMapCenterCoordinates([centerCoords[0], centerCoords[1]]);
        setStartEndCoordinates([startEndCoords[0], startEndCoords[1]]);
        setZoomLevel(initialZoom);
        setFillLevelInterval(fillLevelChangeHours);
        setFillThresholds(preferences.fillThresholds);
        setBatteryThresholds(preferences.batteryThresholds);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleMapCenterCoordinateChange = (key: string, value: string): void => {
    // Check if value contains something else than numbers or dots
    if ( !/^[0-9.-]*$/.test(value) ) {value = "0"}
    if (key === "latitude") setMapCenterCoordinates((prevCoordinates) => [value, prevCoordinates[1]]);
    if (key === "longitude") setMapCenterCoordinates((prevCoordinates) => [prevCoordinates[0], value]);
    setUpdated(false);
  };

  const handleStartEndCoordinateChange = (key: string, value: string): void => {
    if ( !/^[0-9.-]*$/.test(value) ) {value = "0"}
    if (key === "latitude") setStartEndCoordinates((prevCoordinates) => [value, prevCoordinates[1]]);
    if (key === "longitude") setStartEndCoordinates((prevCoordinates) => [prevCoordinates[0], value]);
    setUpdated(false);
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // Validate all fields
    let isValid = true;
    let newErrors = { mapCenter: "", startEnd: "", zoomLevel: "", fillLevelInterval: "", fillThresholds: "", batteryThresholds: ""};

    // Check latitude and longitude of map center
    try {
      var mapCenterLat = parseFloat(mapCenterCoordinates[0]);
      var mapCenterLng = parseFloat(mapCenterCoordinates[1]);
      if (
        mapCenterLat < -90 || mapCenterLat > 90 ||
        mapCenterLng < -180 || mapCenterLng > 180
      ) {
        isValid = false;
        newErrors.mapCenter = "Map center coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180).";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.mapCenter = "Map center coordinates must be real numbers.";
    }
    // Check latitude and longitude of start and end location of routes
    try {
      var startEndLat = parseFloat(startEndCoordinates[0]);
      var startEndLng = parseFloat(startEndCoordinates[1]);
      if (
        startEndLat < -90 || startEndLat > 90 ||
        startEndLng < -180 || startEndLng > 180
      ) {
        isValid = false;
        newErrors.startEnd = "Start and end coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180).";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.startEnd = "Start and end coordinates must be real numbers.";
    }

    // Check zoom level
    try {
      var zoom = parseFloat(zoomLevel);
      if (zoom < 0 || zoom > 20) {
        isValid = false;
        newErrors.zoomLevel = "Zoom level must be a number between 0 and 20.";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.zoomLevel = "Zoom level must be a real number.";
    }

    // Check fill level interval
    try {
      var interval = parseFloat(fillLevelInterval);
      if (interval < 0) {
        isValid = false;
        newErrors.fillLevelInterval = "Fill level interval must be a positive number.";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.fillLevelInterval = "Fill level interval must be a real number.";
    }

    // Check fill level thresholds
    try {
      var fill1 = parseFloat(fillThresholds[0]);
      var fill2 = parseFloat(fillThresholds[1]);
      if (fill1 < 0 || fill1 > 100 || fill2 < 0 || fill2 > 100) {
        isValid = false;
        newErrors.fillThresholds = "Fill level thresholds must be numbers between 0 and 100.";
      }
      // First number must be smaller than the second number
      if (fill1 > fill2) {
        isValid = false;
        newErrors.fillThresholds = "First fill level threshold must not be larger than the second threshold.";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.fillThresholds = "Fill level thresholds must be real numbers.";
    }

    // Check battery level thresholds
    try {
      var battery1 = parseFloat(batteryThresholds[0]);
      var battery2 = parseFloat(batteryThresholds[1]);
      if (battery1 < 0 || battery1 > 100 || battery2 < 0 || battery2 > 100) {
        isValid = false;
        newErrors.batteryThresholds = "Battery level thresholds must be numbers between 0 and 100.";
      }
      if (battery1 < battery2) {
        isValid = false;
        newErrors.batteryThresholds = "First battery level threshold must not be smaller than the second threshold.";
      }
    }
    catch (error) {
      isValid = false;
      newErrors.batteryThresholds = "Battery level thresholds must be real numbers.";
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const projectId = localStorage.getItem("projectId");

      await api.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/project/${projectId}`,
        {
          centerCoords: [mapCenterCoordinates[0], mapCenterCoordinates[1]],
          startEndCoords: [startEndCoordinates[0], startEndCoordinates[1]],
          initialZoom: zoomLevel,
          preferences: {
            fillThresholds,
            batteryThresholds,
          },
          fillLevelChangeHours: fillLevelInterval,
        },
        {
          headers: {
            Authorization: `Bearer ${token?.replace(/"/g, "")}`,
          },
        }
      );
      setUpdated(true);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const handleCancel = () => {
    window.location.href = window.location.href.replace("/settings", "");
    setUpdated(false);
  };

  useEffect(() => {
    if (updated) {
      window.location.href = window.location.href.replace("/settings", "");
    }
  }, [updated]);

  if (loading) return <LoadingComponent />

  return (
    <div className="px-1">
      <PageTitle title={t("menu.project_settings")} />
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Map Center Coordinates */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.coordinates_city_center")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.coordinates_city_center_info")}</span>
            </span>
          </div>
          <div className="flex">
            <input
              type="text"
              value={mapCenterCoordinates[0]}
              onChange={(e) => handleMapCenterCoordinateChange("latitude", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px] mr-2"
            />
            <input
              type="text"
              value={mapCenterCoordinates[1]}
              onChange={(e) => handleMapCenterCoordinateChange("longitude", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
            />
          </div>
          {errors.mapCenter && <p className="text-red-500">{t(errors.mapCenter)}</p>}
        </div>
  
        {/* Start-End Coordinates */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.coordinates_depot")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.coordinates_depot_info")}</span>
            </span>
          </div>
          <div className="flex">
            <input
              type="text"
              value={startEndCoordinates[0]}
              onChange={(e) => handleStartEndCoordinateChange("latitude", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px] mr-2"
            />
            <input
              type="text"
              value={startEndCoordinates[1]}
              onChange={(e) => handleStartEndCoordinateChange("longitude", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
            />
          </div>
          {errors.startEnd && <p className="text-red-500">{t(errors.startEnd)}</p>}
        </div>
  
        {/* Zoom Level */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.zoom_level")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.zoom_level_info")}</span>
            </span>
          </div>
          <input
            type="text"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-[100px]"
          />
          {errors.zoomLevel && <p className="text-red-500">{t(errors.zoomLevel)}</p>}
        </div>
  
        {/* Fill Level Interval */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.fill_level_interval")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.fill_level_interval_info")}</span>
            </span>
          </div>
          <input
            type="text"
            value={fillLevelInterval}
            onChange={(e) => setFillLevelInterval(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-[100px]"
          />
          {errors.fillLevelInterval && <p className="text-red-500">{t(errors.fillLevelInterval)}</p>}
        </div>
  
        {/* Fill Level Thresholds */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.fill_level_thresholds")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.fill_level_thresholds_info")}</span>
            </span>
          </div>
          <div className="flex">
            <div className="w-1/5 h-12 bg-green-600" />
            <input
              type="text"
              value={fillThresholds[0]}
              onChange={(e) => setFillThresholds([e.target.value, fillThresholds[1]])}
              className="border border-gray-300 rounded-l px-3 py-2 w-1/5"
            />
            <div className="w-1/5 h-12 bg-yellow-400" />
            <input
              type="text"
              value={fillThresholds[1]}
              onChange={(e) => setFillThresholds([fillThresholds[0], e.target.value])}
              className="border border-gray-300 rounded-r px-3 py-2 w-1/5"
            />
            <div className="w-1/5 h-12 bg-red-600" />
          </div>
          {errors.fillThresholds && <p className="text-red-500">{t(errors.fillThresholds)}</p>}
        </div>
  
        {/* Battery Level Thresholds */}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">{t("menu.battery_level_thresholds")}</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">{t("menu.battery_level_thresholds_info")}</span>
            </span>
          </div>
          <div className="flex">
            <div className="w-1/5 h-12 bg-green-600" />
            <input
              type="text"
              value={batteryThresholds[0]}
              onChange={(e) => setBatteryThresholds([e.target.value, batteryThresholds[1]])}
              className="border border-gray-300 rounded-l px-3 py-2 w-1/5"
            />
            <div className="w-1/5 h-12 bg-yellow-400" />
            <input
              type="text"
              value={batteryThresholds[1]}
              onChange={(e) => setBatteryThresholds([batteryThresholds[0], e.target.value])}
              className="border border-gray-300 rounded-r px-3 py-2 w-1/5"
            />
            <div className="w-1/5 h-12 bg-red-600" />
          </div>
          {errors.batteryThresholds && <p className="text-red-500">{t(errors.batteryThresholds)}</p>}
        </div>
  
        {/* Save and Cancel Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md w-[200px]"
          >
            {t("menu.save_settings")}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-md w-[200px]"
          >
            {t("menu.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
  
}
