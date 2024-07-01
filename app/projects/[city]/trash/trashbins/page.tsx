/**
 * eslint-disable @next/next/no-img-element
 *
 * @format
 */

/**
 * eslint-disable @next/next/no-img-element
 *
 * @format
 */

/** @format */
"use client";

import React, { useCallback, useState, useEffect } from "react";
import PageTitle from "@/components/PageTitle";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";

type Props = {};

type Trashbin = {
  id: string;
  identifier: string;
  name: string;
  location: string;
  project: string;
  // createdAt: Date;
  // updatedAt: Date;
  lastEmptied: Date;
  batteryLevel: number;
  signalStrength: number;
  assigned: boolean;
};

const headerSortButton = (column: any, displayname: string) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {displayname}
    </Button>
  );
};

const columns: ColumnDef<Trashbin>[] = [
  {
    accessorKey: "identifier",
    header: ({ column }) => {
      return headerSortButton(column, "Identifier");
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return headerSortButton(column, "Name");
    },
  },
  {
    accessorKey: "fillLevel",
    header: ({ column }) => {
      return headerSortButton(column, "Fill Level");
    },
  },
  {
    accessorKey: "fillLevelChange",
    header: ({ column }) => {
      return headerSortButton(column, "Fill Level Change");
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return headerSortButton(column, "Location");
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return headerSortButton(column, "Created At");
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return headerSortButton(column, "Updated At");
    },
  },
  {
    accessorKey: "lastEmptied",
    header: ({ column }) => {
      return headerSortButton(column, "Last Emptied");
    },
  },
  {
    accessorKey: "batteryLevel",
    header: ({ column }) => {
      return headerSortButton(column, "Battery Level");
    },
  },
  {
    accessorKey: "signalStrength",
    header: ({ column }) => {
      return headerSortButton(column, "Signal Strength");
    },
  },
  { accessorKey: "assigned", 
    header: ({ column }) => {
      return headerSortButton(column, "Assigned");
    },
  },
];

export default function TrashbinsOverview({}: Props) {
  const [trashbinData, setTrashbinData] = useState([]);
  const router = useRouter();

  const handleClick = useCallback((trashbin: Trashbin) => {
    const city = localStorage.getItem("cityName");
    const type = localStorage.getItem("projectType");
    router.push(`/projects/${city}/${type}/trashbins/${trashbin.identifier}`);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const projectId = localStorage.getItem("projectId");

        const response = await axios.get(
          `http://localhost:${process.env.NEXT_PUBLIC_PORT}/api/v1/trashbin?project=${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token.replace(/"/g, "")}`,
            },
          }
        );

        const transformedData = response.data.trashbins.map((item: any) => {
          return {
            id: item._id,
            identifier: item.identifier,
            name: item.name,
            coordinates: item.coordinates,
            location: item.location,
            project: item.project,
            // createdAt: new Date(item.createdAt),
            // updatedAt: new Date(item.updatedAt),
            fillLevel: item.fillLevel,
            fillLevelChange: item.fillLevelChange,
            batteryLevel: item.batteryLevel,
            signalStrength: item.signalStrength,
          };
        });

        setTrashbinData(transformedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title="Trashbins" />
      <div className="w-[80vw]">
        <DataTable
          columns={columns}
          data={trashbinData}
          onRowClick={handleClick}
        />
      </div>
    </div>
  );
}
