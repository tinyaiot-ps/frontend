"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import axios from "axios";
//import { Map } from '@/components/Map';
import { LatLngTuple } from 'leaflet';
import PageTitle from "@/components/PageTitle";
import Map from "@/components/Map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LoadingComponent from '@/components/LoadingComponent';
import { Trashbin } from '@/app/types';
import { Copy, Info } from 'lucide-react';
import {useTranslation} from '@/lib/TranslationContext'
import { useRouter } from "next/navigation";

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
    { accessorKey: "identifier", 
      header: ({ column }) => {
        return headerSortButton(column, "Identifier");
      },
    },
    { accessorKey: "name", 
      header: ({ column }) => {
        return headerSortButton(column, "Name");
      },
    },
    { accessorKey: "fillLevel",
      header: ({ column }) => {
        return headerSortButton(column, "Fill Level");
      },
    },
    { accessorKey: "fillLevelChange",
      header: ({ column }) => {
        return headerSortButton(column, "Fill Level Change");
      },
    },
];

// TODO: We need to host our own OSRM server for production
const OSRM_SERVER_URL = 'https://router.project-osrm.org';

const RoutePlanning = () => {
  // Bins selected by user by clicking on map or table-row
  const [selectedBins, setSelectedBins] = useState<Trashbin[]>([]);
  const [trashbinData, setTrashbinData] = useState<Trashbin[]>([]);
  const [initialTrashbinData, setInitialTrashbinData] = useState<Trashbin[]>([]);

  // Optimized order of bins based on route optimization
  const [optimizedBins, setOptimizedBins] = useState<Trashbin[]>([]);
  // Whether to show the optimized route on the map
  const [showRoute, setShowRoute] = useState(false);
  // Active tab in the tabs component
  const [activeTab, setActiveTab] = useState('map');
  // GoogleMaps link to be exported
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  // Dialog state for showing the GoogleMaps link
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Trashbin data fetched from the our backend
  const [centerCoordinates, setCenterCoordinates] = useState<LatLngTuple | null>(null);
  const [startEndCoordinates, setStartEndCoordinates] = useState<LatLngTuple | null>(null);
  const [initialZoom, setInitialZoom] = useState<number | null>(null);
  const [fillThresholds, setFillThresholds] = useState<[number, number] | null>(null);
  const [batteryThresholds, setBatteryThresholds] = useState<[number, number] | null>(null);
  const router = useRouter();

  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const projectId = localStorage.getItem("projectId");

        const allTrashbinsResponse = await axios.get(
          `/api/v1/trashbin?project=${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );
        const allTrashbins = allTrashbinsResponse.data.trashbins;

        const transformedTrashbinData: Trashbin[] = allTrashbinsResponse.data.trashbins;


        const assignedTrashbins = allTrashbins;
        const unassignedTrashbins = transformedTrashbinData.filter((bin) => !assignedTrashbins.some((assignedBin: Trashbin) => assignedBin._id === bin._id));
        setInitialTrashbinData(allTrashbins);
        setTrashbinData(allTrashbins);

        const projectResponse = await axios.get(
          `/api/v1/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token?.replace(/"/g, "")}`,
            },
          }
        );

        const { centerCoords, startEndCoords, initialZoom, preferences } =
          projectResponse.data.project;
          
        setCenterCoordinates(centerCoords);
        setStartEndCoordinates(startEndCoords);
        setInitialZoom(initialZoom);
        setFillThresholds(preferences.fillThresholds);
        setBatteryThresholds(preferences.batteryThresholds);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        }
      }
    };
    fetchData();
  }, [router]);

  // Add trashbin if not already selected, otherwise remove it
  const handleTrashbinClick = useCallback((trashbin: Trashbin) => {
    setSelectedBins((prevSelected) => {
      
        if (prevSelected.some((bin) => bin.identifier === trashbin.identifier)) return prevSelected.filter((bin) => bin.identifier !== trashbin.identifier);
        else return [...prevSelected, trashbin];
    });
    return true;
  }, []);

  // Fetch optimized route from OSRM Trip Service
  const fetchOptimizedRoute = async (): Promise<Trashbin[]> => {
    // If no bins are selected, we cannot plan a route
    if (selectedBins.length === 0 || !startEndCoordinates) return [];
    
    // The roundtrip starts and ends at the location indicated by `startEndCoordinates`
    const coordinates: string[] = [
      `${startEndCoordinates[1]},${startEndCoordinates[0]}`,
      ...selectedBins.map(bin => `${bin.coordinates[1]},${bin.coordinates[0]}`),
      `${startEndCoordinates[1]},${startEndCoordinates[0]}`
    ];

    // OSRM Trip Service API URL
    const url = `${OSRM_SERVER_URL}/trip/v1/driving/${coordinates.join(';')}?source=first&destination=last&roundtrip=false`;

    try {
      const response = await axios.get(url);

      // Only handle case where we get exactly one trip
      if (response.data.trips.length === 1) {
        // The waypoint index at a given position is the new index of the bin in the selectedBins array
        const optimizedWaypoints = response.data.waypoints;
        const waypointIndices = optimizedWaypoints.map((wp: { waypoint_index: number; }) => wp.waypoint_index - 1).slice(1, -1);
        const orderedBins = new Array(waypointIndices.length);
        for (let i = 0; i < waypointIndices.length; i++) {
          orderedBins[waypointIndices[i]] = selectedBins[i];
        }

        // Returns the bins in the optimized order
        return orderedBins;
      }
    } catch (error) {
      console.error('Error while fetching optimized route:', error);
    }
    return [];
  };

  const handleShowRoute = async () => {
    // To show the route, we need to show the map tab
    setActiveTab('map');
    // Fetch optimized route
    const orderedBins = await fetchOptimizedRoute();
    setOptimizedBins(orderedBins);
    // Show the route
    setShowRoute(true);
  };

  // If the active tab is not 'map' don't show the route anymore
  useEffect(() => {
    if (activeTab !== 'map') {
      setShowRoute(false);
    }
  }, [activeTab]);

  // Generate GoogleMaps link for the route and show it in a dialog
  const showGoogleMapsLink = async () => {
    if (!startEndCoordinates) return;

    // Fetch optimized route, if not already done
    var orderedBins: Trashbin[] = [];
    if (showRoute) orderedBins = optimizedBins;
    else {
      orderedBins = await fetchOptimizedRoute();
      setOptimizedBins(orderedBins);
    }

    // Use orderedBins here instead of optimizedBins, as optimizedBins might not be updated yet
    const coordinates: string[] = [
      `${startEndCoordinates[0]},${startEndCoordinates[1]}`,
      ...orderedBins.map(bin => `${bin.coordinates[0]},${bin.coordinates[1]}`),
      `${startEndCoordinates[0]},${startEndCoordinates[1]}`
    ];
  
    const googleMapsUrl = `https://www.google.com/maps/dir/${coordinates.join('/')}`;
    setGoogleMapsLink(googleMapsUrl);
    setIsDialogOpen(true);
  };

  // Assigns currently selected bins to a collector
  const removeBins = () => {
    if (selectedBins.length === 0) return; // No bins to remove 
    // Filter out the selected bins from trashbinData

    const updatedTrashbinData = trashbinData.filter(
      (bin) => !selectedBins.some((selectedBin) => selectedBin._id === bin._id)
    );    
    // Update the state to reflect the removal
    setTrashbinData(updatedTrashbinData);
    // Optionally, clear the selected bins to reset selection
    setShowRoute(false)
    setSelectedBins([]);
  };
  
  // Unassigns all bins
  const showAllBins = () => {
    // Check if trashbinData already contains all bins
    if (trashbinData.length === initialTrashbinData.length) {
     
      return;
    } 
    // Update the state to reflect all bins
    setTrashbinData(initialTrashbinData);
    // Optionally, clear the selected bins to reset selection
    setSelectedBins([]);
  };
  
  // Handle the animation for the copy button
  const handleCopy = () => {
    // Find the button by its ID and add the effect class
    const copyButton = document.getElementById('copyLink');
    copyButton?.classList.add('button-click-effect');
    // Remove the effect class after the animation duration
    setTimeout(() => {
      copyButton?.classList.remove('button-click-effect');
    }, 500); // Duration has to match with CSS animation duration
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <PageTitle title={t("menu.route_planning")} />
      <div className="flex items-center justify-start">
        <Info className="text-gray-500 mr-2" />
        <p className="text-lg text-gray-500">{t("menu.select_bins_instruction")}</p>
      </div>
      <section className="grid grid-cols-2 gap-4 transition-all lg:grid-cols-4">
        <Button className="bg-green-600 text-white" onClick={handleShowRoute}>
          {t("menu.show_route")}
        </Button>
        <Button className="bg-green-600 text-white" onClick={showGoogleMapsLink}>
          {t("menu.export_to_maps")}
        </Button>
        <Button className="bg-blue-600 text-white" onClick={removeBins}>
          {t("menu.assign_route")}
        </Button>
        <Button className="bg-blue-600 text-white" onClick={showAllBins}>
          {t("menu.unassign_all_bins")}
        </Button>
      </section>
      {/* Only render the tabs when all information was fetched */}
      {centerCoordinates && initialZoom && fillThresholds && batteryThresholds && startEndCoordinates ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="map" className="w-full">
              {t("menu.map_view")}
            </TabsTrigger>
            <TabsTrigger value="table" className="w-full">
              {t("menu.table_view")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            <div className="w-full h-[80vh] relative z-0">
    `       <Map
                  key={trashbinData.length} // This ensures the map re-renders when trashbinData changes
                  trashbinData={trashbinData}
                  centerCoordinates={centerCoordinates}
                  initialZoom={initialZoom}
                  fillThresholds={fillThresholds}
                  batteryThresholds={batteryThresholds}
                  isRoutePlanning={true}
                  onTrashbinClick={handleTrashbinClick}
                  tripStartEnd={startEndCoordinates}
                  selectedBins={selectedBins}
                  optimizedBins={optimizedBins}
                  showRoute={showRoute}
                />

            </div>
          </TabsContent>
          <TabsContent value="table">
            <div className="w-full h-[80vh] overflow-auto">
              <DataTable
                columns={columns}
                data={trashbinData}
                onRowClick={handleTrashbinClick}
                selectedRows={selectedBins}
                showSearchBar={true}
                showExportButton={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <LoadingComponent text={t("menu.loading_map")} />
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>{t("menu.google_maps_link")}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-between">
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-blue-500 underline"
                >
                  {googleMapsLink}
                </a>
                <div className="tooltip">
                  <CopyToClipboard text={googleMapsLink} onCopy={handleCopy}>
                    <Button id="copyLink" className="bg-blue-600 text-white ml-2">
                      <Copy />
                    </Button>
                  </CopyToClipboard>
                  <span className="tooltiptext">{t("menu.copy")}</span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default RoutePlanning;
