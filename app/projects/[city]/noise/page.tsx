"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import { CardContent } from "@/components/Card";
import NoiseChart from "@/components/NoiseChart";
import LoadingComponent from "@/components/LoadingComponent";
import { Info, Settings } from "lucide-react";

function redirectToSettings() {
  window.location.href = window.location.href + "/settings";
}

export default function NoiseDashboard() {
  const [noiseData, setNoiseData] = useState<any[]>([]);
  const [activeTimeInterval, setActiveTimeInterval] = useState<[number, number]>([0, 0]);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

        setNoiseThreshold(parseInt(noiseThreshold));
        setConfidenceThreshold(parseFloat(confidenceThreshold));
        setActiveTimeInterval([activeTimeInterval[0], activeTimeInterval[1]]);

        // Here we have enough data so we can show the page
        setLoading(false);

        // Fetch history data of the noise sensor
        // Fetch real data in the emsdetten project, else mock data
        const city = localStorage.getItem("cityName");
        var sensorId = "";
        if (city === 'emsdetten') {
          sensorId = "668e92ca094613ff3bade435";
        } else {
          sensorId = "668e6b79e921750c7a2fe08d";
        }

        const historyResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/history/sensor/${sensorId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        if (historyResponse.data) {
          const measurements = historyResponse.data.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            measurement: item.measurement,
            noisePrediction: item.noisePrediction,
          }));
          setNoiseData(measurements);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingComponent/>;

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title="Noise Dashboard" />
      <section className="grid grid-cols-1  gap-4 transition-all">
          { noiseData.length === 0 ? 
            <div className="h-40px">
              <CardContent>
                <LoadingComponent text="Loading history..."/>
              </CardContent>
            </div> :
          <CardContent>
            <p className="p-4 font-semibold">Noise Level in decibels relative to full scale (dBFS)</p>
              <NoiseChart
                noiseData={noiseData}
                noiseThreshold={noiseThreshold}
                confidenceThreshold={confidenceThreshold} />
          </CardContent>
        }
      </section>
      <div className="flex items-center justify-start">
        <Info className="text-gray-500 mr-2" />
        <p className="text-lg text-gray-500">Hover over the points in the red area to see the classification of the model.</p>
      </div>
      <div className="flex flex-col gap-2">
      <div className="flex items-center justify-start">
        <p className="text-lg">Active time interval of noise detector:&nbsp;
          <span className="text-blue-500 info-tooltip">
            {activeTimeInterval[0].toString().padStart(2, '0')}:00 - {activeTimeInterval[1].toString().padStart(2, '0')}:00
            <span className="info-tooltip-text">This value can be changed in the settings</span>
          </span>
        </p>
        <button onClick={redirectToSettings} className="text-blue-500 ml-2 info-tooltip">
          <Settings />
        </button>
      </div>
        <p className="text-lg">
          <span className="text-red-500">Red points</span> are irregularities, as they satisfy both of the following conditions:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <div className="flex items-center justify-start">
              <p className="text-lg">Above the threshold of&nbsp;
                <span className="text-blue-500 info-tooltip">
                  {noiseThreshold}dBFS
                  <span className="info-tooltip-text">This value can be changed in the settings</span>
                </span>
              </p>
              <button onClick={redirectToSettings} className="text-blue-500 ml-2 info-tooltip">
                <Settings />
              </button>
            </div>
          </li>
          <li>
            <div className="flex items-center justify-start">
              <p className="text-lg">Classified as noise with a confidence greater than&nbsp;
                <span className="text-blue-500 info-tooltip">
                {confidenceThreshold}%
                  <span className="info-tooltip-text">This value can be changed in the settings</span>
                </span>
              </p>
              <button onClick={redirectToSettings} className="text-blue-500 ml-2 info-tooltip">
                <Settings />
              </button>
            </div>   
          </li>
        </ul>
      </div>
    </div>
  );
}

 