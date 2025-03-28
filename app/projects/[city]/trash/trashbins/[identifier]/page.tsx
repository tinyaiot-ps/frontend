"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/Card";
import { Button } from "@/components/ui/button";
import LineChart from "@/components/LineChart";
import LoadingComponent from "@/components/LoadingComponent";
import { Trashbin } from '@/app/types';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from "@/lib/TranslationContext";
import { useRouter } from "next/navigation";

interface HistoryDataItem {
  timestamp: Date;
  fillLevel: number;
  batteryLevel: number;
}

interface DataItem {
  timestamp: Date;
  measurement: number;
}

const columns: ColumnDef<HistoryDataItem>[] = [
  { accessorKey: "timestamp", header: "Time" },
  { accessorKey: "fillLevel", header: "Fill Level" },
  { accessorKey: "batteryLevel", header: "Battery Level" },
];

export default function TrashbinDetail({
  params,
}: {
  params: { identifier: string };
}) {
  const [fillThresholds, setFillThresholds] = useState<[number, number]>([0, 0]);
  const [batteryThresholds, setBatteryThresholds] = useState<[number, number]>([0, 0]);
  const [trashbinData, setTrashbinData] = useState<Trashbin | null>();
  const [fillLevelData, setFillLevelData] = useState<DataItem[]>([]);
  const [batteryLevelData, setBatteryLevelData] = useState<DataItem[]>([]);
  const [history, setHistory] = useState<HistoryDataItem[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { t } = useTranslation();
  const router = useRouter();
  

  useEffect(() => {
    if (!socket) {
      const newSocket: Socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);

      newSocket.on('newData', (data) => {
        if(data.message.fill_level) {
          let adjustedFillLevel = (data.message.fill_level<=1) ? data.message.fill_level*100 : data.message.fill_level;
          setTrashbinData(trashbinData => {
            if(trashbinData && trashbinData.sensors.includes(data.message.sensor_id)) {
              return {
                ...trashbinData,
                fillLevel: adjustedFillLevel,
              };
            }
            return trashbinData;
          });
          setFillLevelData(fillLevelData => [...fillLevelData,{'timestamp':new Date(data.message.received_at), 'measurement':adjustedFillLevel}]);
        }
        if(data.message.battery_level) {
          let adjustedBatteryLevel = (data.message.battery_level<=1) ? data.message.battery_level*100 : data.message.battery_level;
          setTrashbinData(trashbinData => {
            if(trashbinData && trashbinData.sensors.includes(data.message.sensor_id)) {
              return {
                ...trashbinData,
                batteryLevel: adjustedBatteryLevel, 
              };
            }
            return trashbinData;
          });
          setBatteryLevelData(batteryLevelData => [...batteryLevelData,{'timestamp':new Date(data.message.received_at), 'measurement':adjustedBatteryLevel}]);
        }
        // TODO: signal_level
        
        console.log('Received new data:', data);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        // Fetch trashbin data
        const response = await axios.get(
          `/api/v1/trashbin/${params.identifier}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        setTrashbinData(response.data);

        // Fetch project settings
        const projectId = localStorage.getItem("projectId");
        const projectResponse = await axios.get(
          `/api/v1/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        setFillThresholds(projectResponse.data.project.preferences.fillThresholds);
        setBatteryThresholds(projectResponse.data.project.preferences.batteryThresholds);

        // Sensor IDs of the trashbin
        const sensorIds = response.data.sensors;
        // Fetch history data of fill level and battery level
        // TODO: this is kind of a shitty solution. Maybe we should first determine what measureType a sensorId has and then do the request
        // Fetch first history data
        const historyResponse0 = await axios.get(
          `/api/v1/history/sensor/${sensorIds[0]}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        if (historyResponse0.data[0]) {
          const measurements = historyResponse0.data.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            measurement: item.measurement,
          }));
          const measureType = historyResponse0.data[0].measureType;

          // We don't know which sensor is which, so we have to check the measureType
          if (measureType === "fill_level") {
            setFillLevelData(measurements);
          }
          if (measureType === "battery_level") {
            setBatteryLevelData(measurements);
          }
        } else {
          setFillLevelData([]);
          setBatteryLevelData([]);
        }
        // Fetch second history data
        const historyResponse1 = await axios.get(
          `/api/v1/history/sensor/${sensorIds[1]}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        if (historyResponse1.data[0]) {
          const measurements = historyResponse1.data.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            measurement: item.measurement,
          }));
          const measureType = historyResponse1.data[0].measureType;

          if (measureType === "fill_level") {
            setFillLevelData(measurements);
          }
          if (measureType === "battery_level") {
            setBatteryLevelData(measurements);
          }
        } else {
          setFillLevelData([]);
          setBatteryLevelData([]);
        }
        // Fetch third history data
        const historyResponse2 = await axios.get(
          `/api/v1/history/sensor/${sensorIds[2]}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        if (historyResponse2.data[0]) {
          const measurements = historyResponse2.data.map((item: any) => ({
            timestamp: new Date(item.createdAt),
            measurement: item.measurement,
          }));
          const measureType = historyResponse2.data[0].measureType;

          if (measureType === "fill_level") {
            setFillLevelData(measurements);
          }
          if (measureType === "battery_level") {
            setBatteryLevelData(measurements);
          }
        } else {
          setFillLevelData([]);
          setBatteryLevelData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        }
      }
    };

    fetchData();
  }, [params.identifier,router]);

  // Combine fillLevel and batteryLevel data to one object to display in the table
  useEffect(() => {
    // Round timestamps to the next n seconds
    // (e.g. 2 seconds to group data in 2 second intervals)
    // This is necessary because the timestamps differ slightly
    const n = 2;
    const roundToNextNSeconds = (date: Date, n: number) => {
      const seconds = Math.ceil(date.getTime() / 1000);
      const roundedSeconds = seconds + (n - (seconds % n));
      return new Date(roundedSeconds * 1000);
    };
    const roundedFillLevelData = fillLevelData.map(item => ({
      timestamp: roundToNextNSeconds(item.timestamp, n),
      measurement: item.measurement,
    }));

    const roundedBatteryLevelData = batteryLevelData.map(item => ({
      timestamp: roundToNextNSeconds(item.timestamp, n),
      measurement: item.measurement,
    }));

    const timestamps = new Set([...roundedFillLevelData.map(item => item.timestamp.getTime()), ...roundedBatteryLevelData.map(item => item.timestamp.getTime())]);
    const fillLevels = new Map(roundedFillLevelData.map(item => [item.timestamp.getTime(), item.measurement]));
    const batteryLevels = new Map(roundedBatteryLevelData.map(item => [item.timestamp.getTime(), item.measurement]));

    const historyData: HistoryDataItem[] = [];

    timestamps.forEach(timestamp => {
      historyData.push({
        timestamp: new Date(timestamp),
        fillLevel: fillLevels.get(timestamp) ?? 0,
        batteryLevel: batteryLevels.get(timestamp) ?? 0,
      });
    });

    historyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    setHistory(historyData);
  }, [fillLevelData, batteryLevelData]);

  if (!trashbinData) return <LoadingComponent />;

  function getEditUrl(): string {
    const city = localStorage.getItem("cityName");
    const type = localStorage.getItem("projectType");
    return `/projects/${city}/${type}/trashbins/${params.identifier}/edit`;
  }
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between">
   <PageTitle
  title={t("trashbin.title")
    .replace("{{name}}", trashbinData.name || "")
    .replace("{{identifier}}", trashbinData.identifier || "")}
/>

        <Button asChild className="bg-green-600 text-white">
          <Link href={getEditUrl()}>{t("trashbin.editButton")}</Link>
        </Button>
      </div>
      {fillLevelData.length === 0 && batteryLevelData.length === 0 ? (
        <div className="h-40px">
          <CardContent>
            <LoadingComponent text={t("trashbin.noHistory")} />
          </CardContent>
        </div>
      ) : (
        <Tabs defaultValue="visual" className="">
          <TabsList className="w-full">
            <TabsTrigger value="visual" className="w-full">
              {t("trashbin.tabs.graphicalView")}
            </TabsTrigger>
            <TabsTrigger value="table" className="w-full">
              {t("trashbin.tabs.tableView")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="visual">
            <section className="grid grid-cols-1 gap-4 transition-all lg:grid-cols-2">
              {fillLevelData.length > 0 && (
                <CardContent>
                  <p className="p-4 font-semibold">{t("trashbin.fillLevel")}</p>
                  <LineChart
                    historyData={fillLevelData}
                    green={[0, fillThresholds[0]]}
                    yellow={[fillThresholds[0], fillThresholds[1]]}
                    red={[fillThresholds[1], 100]}
                  />
                </CardContent>
              )}
              {batteryLevelData.length > 0 && (
                <CardContent>
                  <p className="p-4 font-semibold">{t("trashbin.batteryLevel")}</p>
                  <LineChart
                    historyData={batteryLevelData}
                    green={[batteryThresholds[0], 100]}
                    yellow={[batteryThresholds[1], batteryThresholds[0]]}
                    red={[0, batteryThresholds[1]]}
                  />
                </CardContent>
              )}
            </section>
          </TabsContent>
          <TabsContent value="table">
            <div className="h-[510px] overflow-y-auto">
              <DataTable
                columns={columns}
                data={history}
                showSearchBar={false}
                showExportButton={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      )}
      <section className="">
        <div className="flex gap-3 items-center">
          <p className="inline text-lg">
            <strong className="font-bold">{t("trashbin.location")}:</strong>{" "}
            {trashbinData.location} ({trashbinData.coordinates[0]},{" "}
            {trashbinData.coordinates[1]})
          </p>
          <Button className="bg-green-600 text-white">
            <Link
              href={`https://www.google.com/maps/@${trashbinData.coordinates[0]},${trashbinData.coordinates[1]},z=18?q=${trashbinData.coordinates[0]},${trashbinData.coordinates[1]}`}
              target="_blank"
            >
              {t("trashbin.viewOnGoogleMaps")}
            </Link>
          </Button>
        </div>
        <p className="text-lg">
          <strong className="font-bold">{t("trashbin.lastEmptied")}:</strong>{" "}
          {trashbinData.lastEmptied
            ? trashbinData.lastEmptied.toString()
            : t("trashbin.notAvailable")}
        </p>
        <p className="text-lg">
          <strong className="font-bold">{t("trashbin.signalStrength")}:</strong>{" "}
          {trashbinData.signalStrength}
        </p>
      </section>
    </div>
  );
};


