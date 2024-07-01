// app/trashbins/[identifier]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import PageTitle from "@/components/PageTitle";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FillLevelChart from "@/components/FillLevelChart";
import { CardContent } from "@/components/Card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {};

type Trashbin = {
  id: string;
  identifier: string;
  name: string;
  coordinates: [number, number];
  location: string;
  project: string;
  sensors: any[];
  createdAt: Date;
  updatedAt: Date;
};

const columns: ColumnDef<Trashbin>[] = [
  { accessorKey: "timestamp", header: "Time" },
  { accessorKey: "fill", header: "Fill Level" },
  { accessorKey: "batteryLevel", header: "Battery Level" },
];

export default function TrashbinDetail({
  params,
}: {
  params: { identifier: string };
}) {
  const [data, setData] = useState<Trashbin | null>(null);
  const timestamps = Array.from(
    { length: 97 },
    (_, i) => new Date(Date.now() + (i - 48) * 3600000)
  );

  var fill_levels_past = new Array(49).fill({
    timestamp: timestamps[0],
    fill: 0,
    batteryLevel: 0,
  });
  for (let i = 1; i < fill_levels_past.length; i++) {
    const prev = fill_levels_past[i - 1].fill || 0;
    fill_levels_past[i] = {
      timestamp: timestamps[i],
      fill: Math.round(Math.min(100, prev + Math.random() * 2)),
      batteryLevel: Math.round(Math.min(100, prev + Math.random() * 4)),
    };
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/v1/trashbin/${params.identifier}`,
          {
            headers: {
              Authorization: `Bearer ${token.replace(/"/g, "")}`,
            },
          }
        );

        const trashbin = {
          id: response.data._id,
          identifier: response.data.identifier,
          name: response.data.name,
          coordinates: response.data.coordinates,
          location: response.data.location,
          project: response.data.project,
          sensors: response.data.sensors,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };

        setData(trashbin);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [params.identifier]);

  if (!data) {
    return <div>Loading...</div>;
  }

  function getEditUrl(): string {
    const city = localStorage.getItem("cityName");
    const type = localStorage.getItem("projectType");
    return `/projects/${city}/${type}/trashbins/${params.identifier}/edit`;
  }

  console.log("on the table", fill_levels_past);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex justify-between">
        <PageTitle title={`Trashbin ${data.name}`} />
        <Button asChild className="bg-green-600 text-white">
          <Link href={getEditUrl()}>Edit Trashcan</Link>
        </Button>
      </div>
      <Tabs defaultValue="visual" className="">
        <TabsList className="w-full">
          <TabsTrigger value="visual" className="w-full">
            Graphical View
          </TabsTrigger>
          <TabsTrigger value="table" className="w-full">
            Table View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visual">
          <section className="grid grid-cols-1  gap-4 transition-all lg:grid-cols-2">
            <CardContent>
              <p className="p-4 font-semibold">Fill Level</p>
              <FillLevelChart />
            </CardContent>
            <CardContent>
              <p className="p-4 font-semibold">Battery Level (TODO!)</p>
              <FillLevelChart />
            </CardContent>
          </section>
        </TabsContent>
        <TabsContent value="table">
          <div className="h-[510px] overflow-y-auto">
            <DataTable
              columns={columns}
              data={fill_levels_past}
              showSearchBar={false}
              showExportButton={false}
            />
          </div>
        </TabsContent>
      </Tabs>
      <section className="mt-5 mr-4 gap-3">
            <div className="flex gap-3 items-center">
              <p className="inline">Location: {data.location}</p>
              <Button className="bg-green-600 text-white">
                <Link
                  href={`https://www.google.com/maps/@${data.coordinates[0]},${data.coordinates[1]},z=18?q=${data.coordinates[0]},${data.coordinates[1]}`}
                  target="_blank"
                >
                  See on Google Maps
                </Link>
              </Button>
            </div>
            <p>Newest Data Point: 25 June 2024</p>
            <p>
              Signal Strength: <span className="text-green-500">Strong</span>
            </p>
          </section>
      
    </div>
  );
}
