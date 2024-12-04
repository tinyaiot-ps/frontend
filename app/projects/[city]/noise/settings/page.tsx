"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import LoadingComponent from "@/components/LoadingComponent";
import { Info } from "lucide-react";

export default function AppSettings() {
  const [activeTimeInterval, setActiveTimeInterval] = useState<[string, string]>(["", ""]);
  const [noiseThreshold, setNoiseThreshold] = useState<string>("");
  const [confidenceThreshold, setConfidenceThreshold] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(false);
  const [errors, setErrors] = useState({ noiseThreshold: "", confidenceThreshold: "", activeTimeInterval: "" });

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

        const { activeTimeInterval, noiseThreshold, confidenceThreshold } =
          projectResponse.data.project;

        setNoiseThreshold(noiseThreshold);
        setConfidenceThreshold(confidenceThreshold);
        setActiveTimeInterval(activeTimeInterval);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    // Validate all fields
    let isValid = true;
    let newErrors = { noiseThreshold: "", confidenceThreshold: "", activeTimeInterval: "" }
    var noiseThresholdNum = 0, confidenceThresholdNum = 0, startHour = 0, endHour = 0;

    try {
      noiseThresholdNum = parseInt(noiseThreshold);
      if (isNaN(noiseThresholdNum) || noiseThresholdNum > 0 || noiseThresholdNum < -100) {
        newErrors.noiseThreshold = "Noise threshold (dBFS) must be a number between -100 and 0.";
        isValid = false;
      }
    }
    catch (error) {
      isValid = false;
      newErrors.noiseThreshold = "Noise threshold (dBFS) must be a number between -100 and 0.";
    }

    try {
      confidenceThresholdNum = parseFloat(confidenceThreshold);
      if (isNaN(confidenceThresholdNum) || confidenceThresholdNum < 0 || confidenceThresholdNum > 100) {
        newErrors.confidenceThreshold = "Confidence threshold must be a number between 0 and 100.";
        isValid = false;
      }
    }
    catch (error) {
      isValid = false;
      newErrors.confidenceThreshold = "Confidence threshold must be a number between 0 and 100.";
    }

    try {
      startHour = parseInt(activeTimeInterval[0]);
      endHour = parseInt(activeTimeInterval[1]);
      if (isNaN(startHour) || startHour < 0 || startHour > 24 || isNaN(endHour) || endHour < 0 || endHour > 23) {
        newErrors.activeTimeInterval = "Active time interval must be a number between 0 and 24.";
        isValid = false;
      }
    }
    catch (error) {
      isValid = false;
      newErrors.activeTimeInterval = "Active time interval must be a number between 0 and 24.";
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
          activeTimeInterval: [startHour, endHour],
          confidenceThreshold: confidenceThresholdNum,
          noiseThreshold: noiseThresholdNum,
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

  if (loading) return <LoadingComponent />;

  return (
    <div className="p-6">
      <PageTitle title="App Settings" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">Noise Threshold (dBFS)</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">Loudness of sound to be considered noise. The scale is in decibels relative to full scale (dBFS).</span>
            </span>
          </div>
          <input
            type="text"
            value={noiseThreshold ? noiseThreshold : ""}
            onChange={(e) => setNoiseThreshold(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-[100px]"
          />
          {errors.noiseThreshold && <p className="text-red-500">{errors.noiseThreshold}</p>}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">Confidence Threshold</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">Confidence of model needed to classify sound as noise.</span>
            </span>
          </div>
          <input
            type="text"
            value={confidenceThreshold ? confidenceThreshold : ""}
            onChange={(e) => setConfidenceThreshold(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-[100px]"
          />
        </div>
        {errors.confidenceThreshold && <p className="text-red-500">{errors.confidenceThreshold}</p>}
        <div className="flex flex-col">
          <div className="flex items-center justify-start">
            <label className="mb-1 text-lg">Active Time Interval</label>
            <span className="text-blue-500 info-tooltip">
              <Info className="text-gray-500 ml-4 mr-2" />
              <span className="info-tooltip-text">Hours in which the sensor measures and which are displayed in the dashboard.</span>
            </span>
          </div>
          <div className="flex">
            <input
              type="text"
              value={activeTimeInterval ? activeTimeInterval[0] : ""}
              onChange={(e) => setActiveTimeInterval(
                activeTimeInterval ? [e.target.value, activeTimeInterval[1]] : [e.target.value, '']
              )}
              className="border border-gray-300 rounded-l px-3 py-2 w-[100px] mr-2"
            />
            <input
              type="text"
              value={activeTimeInterval ? activeTimeInterval[1] : ""}
              onChange={(e) => setActiveTimeInterval(
                activeTimeInterval ? [activeTimeInterval[0], e.target.value] : ['', e.target.value]
              )}
              className="border border-gray-300 rounded-r px-3 py-2 w-[100px]"
            />
          </div>
        </div>
        {errors.activeTimeInterval && <p className="text-red-500">{errors.activeTimeInterval}</p>}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
