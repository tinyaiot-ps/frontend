/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from 'react-dom/client';
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Trash2, BatteryFull, Signal } from "lucide-react";
import { Trashbin } from '@/app/types';

interface MapProps {
  trashbinData: Trashbin[];
  centerCoordinates: LatLngTuple;
  initialZoom: number;
  fillThresholds: [number, number];
  batteryThresholds: [number, number];
  onTrashbinClick: (trashbin: Trashbin) => void;
  isRoutePlanning: boolean;  // true on route planning page, false on map page
  // The following fields must only be set if isRoutePlanning is true
  tripStartEnd?: LatLngTuple;
  selectedBins?: Trashbin[];
  optimizedBins?: Trashbin[];
  showRoute?: boolean;
}

function PopupContent({ trashbin, routePlanning, fillThresholds, batteryThresholds } : {
  trashbin: Trashbin, 
  routePlanning: boolean, 
  fillThresholds: [number, number], 
  batteryThresholds: [number, number],
}) {
  return (
    <div id={`popup-${trashbin.identifier}`}>
      <div className="text-base font-semibold flex justify-center items-center">
        {trashbin.name}
      </div>
      <hr />
      <div className="flex flex-row items-center justify-between mt-1">
        <div className="flex items-center mr-3">
          <Trash2 size="16px" className={`mr-1 ${trashbin.fillLevel < fillThresholds[0] ? 'text-green-500' : trashbin.fillLevel < fillThresholds[1] ? 'text-yellow-500' : 'text-red-500'}`} />
          <span className={`${trashbin.fillLevel < fillThresholds[0] ? 'text-green-500' : trashbin.fillLevel < fillThresholds[1] ? 'text-yellow-500' : 'text-red-500'}`}>{trashbin.fillLevel}%</span>
        </div>
        {/* Only render the battery level in map page */}
        {!routePlanning && (
          <div className="flex items-center mr-3">
          <BatteryFull size="16px" className={`mr-1 ${trashbin.batteryLevel > batteryThresholds[0] ? 'text-green-500' : trashbin.batteryLevel > batteryThresholds[1] ? 'text-yellow-500' : 'text-red-500'}`} />
          <span className={`mr-1 ${trashbin.batteryLevel > batteryThresholds[0] ? 'text-green-500' : trashbin.batteryLevel > batteryThresholds[1] ? 'text-yellow-500' : 'text-red-500'}`}>{trashbin.batteryLevel}%</span>
        </div>
        )}
        {/* Only render the signal strength in map page */}
        {!routePlanning && (
        <div className="flex items-center">
          <Signal size="16px" className="mr-1" />
          <span>{trashbin.signalStrength}%</span>
        </div>
        )}
      </div>
      {/* Only render the image in map page and if an image exists */}
      {!routePlanning && trashbin.image && (
        <div className="flex justify-center items-center h-full mt-1">
          <img src={trashbin.image} className="max-h-[150px]" alt=""/>
          {/* Alternative placeholder image */}
          {/* <img src="/images/leaflet/bin_bl.png" className="h-[50px]" /> */}
        </div>
      )}
    </div>
  );
}

// Bin icons based on: https://www.vecteezy.com/vector-art/7820754-recycle-icon-garbage-icon-vector-logo-design-template
const createBinIcons = (L: any) => {
  const BinIcon = L.Icon.extend({
    options: {
      shadowUrl: '/images/leaflet/bin_s.png',
      iconSize: [26, 33], // size of icon
      shadowSize: [26, 25], // size of shadow
      iconAnchor: [26 / 2, 33 / 2], // point of icon which will correspond to marker's location
      shadowAnchor: [26 / 2 - 10, 25 / 2], // the same for the shadow
      popupAnchor: [0, -33 / 4], // point from which popup should open relative to iconAnchor
    },
  });

  const BinIconSelected = BinIcon.extend({
    options: {
      iconSize: [35, 35], // size of icon
      popupAnchor: [0, -35 / 4], // point from which popup should open relative to iconAnchor
    },
  });

  return {
    greenBin: new BinIcon({ iconUrl: '/images/leaflet/bin_g.png' }),
    greenBinSelected: new BinIconSelected({ iconUrl: '/images/leaflet/bin_g_b.png' }),
    yellowBin: new BinIcon({ iconUrl: '/images/leaflet/bin_y.png' }),
    yellowBinSelected: new BinIconSelected({ iconUrl: '/images/leaflet/bin_y_b.png' }),
    redBin: new BinIcon({ iconUrl: '/images/leaflet/bin_r.png' }),
    redBinSelected: new BinIconSelected({ iconUrl: '/images/leaflet/bin_r_b.png' }),
    greyBin: new BinIcon({ iconUrl: '/images/leaflet/bin_grey.png' }), // New grey bin icon
    greyBinSelected: new BinIconSelected({ iconUrl: '/images/leaflet/bin_grey_b.png' }), // Selected grey bin
  };
};
// Map initialization

export const initializeMap = (
  L: any,
  centerCoordinates: LatLngTuple,
  initialZoom: number,
  mapRef: any,
  markersRef: any
) => {
  // If no map yet, create one
  if (!mapRef.current) {
    mapRef.current = L.map("map").setView(centerCoordinates, initialZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);
  }

  // If a MarkerClusterGroup already exists, clear it; otherwise create a new one
  if (markersRef.current) {
    markersRef.current.clearLayers();
  } else {
    markersRef.current = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: (cluster: any) => {
        // All markers in this cluster
        const childMarkers = cluster.getAllChildMarkers();
        // Tally of bins by color
        let colorCounts: Record<string, number> = {
          green: 0,
          yellow: 0,
          red: 0,
          grey: 0,
        };

        // Identify bin color by inspecting icon file name
        childMarkers.forEach((marker: any) => {
          const iconUrl = (marker.options.icon as L.Icon)?.options.iconUrl || "";
          if (iconUrl.includes("bin_grey")) {
            colorCounts.grey++;
          } else if (iconUrl.includes("bin_r")) {
            colorCounts.red++;
          } else if (iconUrl.includes("bin_y")) {
            colorCounts.yellow++;
          } else if (iconUrl.includes("bin_g")) {
            colorCounts.green++;
          } 
         
          else if (iconUrl.includes("bin_b")) {  }
        });

        const totalBins =
          colorCounts.grey +
          colorCounts.green +
          colorCounts.yellow +
          colorCounts.red;
        // If for some reason we have zero, fallback to a default grey icon
        if (totalBins === 0) {
          return L.divIcon({
            html: `<div style="background: grey; border-radius: 50%;
                             width: 40px; height: 40px; line-height: 40px;
                             text-align: center; color: #fff;">
                      ${cluster.getChildCount()}
                   </div>`,
            className: "my-cluster-icon",
            iconSize: [40, 40],
          });
        }

        // Build the conic gradient segments
        const colorSlices: Array<[string, number]> = [];
        if (colorCounts.green > 0) colorSlices.push(["green", colorCounts.green]);
        if (colorCounts.yellow > 0) colorSlices.push(["yellow", colorCounts.yellow]);
        if (colorCounts.red > 0) colorSlices.push(["red", colorCounts.red]);
        if (colorCounts.grey > 0) colorSlices.push(["grey", colorCounts.grey]);

        let currentPercent = 0;
        const conicSegments: string[] = [];

        // Each color gets a slice in 0–100%
        colorSlices.forEach(([color, count]) => {
          const start = (currentPercent / totalBins) * 100;
          const end = ((currentPercent + count) / totalBins) * 100;
          conicSegments.push(`${color} ${start}% ${end}%`);
          currentPercent += count;
        });

        const conicGradient = `conic-gradient(${conicSegments.join(", ")})`;
        // Build the HTML
        const size = 40;
        const iconHtml = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${conicGradient};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #fff;
          ">
            ${cluster.getChildCount()}
          </div>
        `;
        // Return the DivIcon
        return L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [size, size],
        });
      },
    });

    // Finally, add the cluster group to the map
    mapRef.current.addLayer(markersRef.current);
  }
};


// Markers addition
const addMarkersToMap = async (
  L: any,
  trashbinData: Trashbin[],
  fillThresholds: [number, number],
  batteryThresholds: [number, number],
  selectedBins: Trashbin[] | undefined,
  isRoutePlanning: boolean,
  onTrashbinClick: (trashbin: Trashbin) => void | undefined,
  markersRef: any
) => { 
  const {
    greenBin,
    greenBinSelected,
    yellowBin,
    yellowBinSelected,
    redBin,
    redBinSelected,
    greyBin,
    greyBinSelected,
  } = createBinIcons(L);
  const defaultIcon = L.icon({
    iconUrl: "/images/leaflet/bin_grey_b.png", // Replace with your icon path
    iconSize: [25, 41], // Adjust the size
    iconAnchor: [12, 41], // Anchor point
  });
  // const token = process.env.NEXT_PUBLIC_API_TOKEN;
  const token = localStorage.getItem("authToken");
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Helper function to fetch sensor history
  const fetchSensorHistory = async (sensorId: string): Promise<any[]> => {
    try {
      const response = await fetch(
        `/api/v1/history/sensor/${sensorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    
      const data = await response.json();
      return data.map((item: any) => ({
        timestamp: new Date(item.createdAt), // Convert to Date object
        measurement: item.measurement,
        measureType: item.measureType,
        sensor: item.sensor,
      }));
    } catch (error) {
   
      return [];
    }
  };

  const seenCoordinates = new Set<string>();
  const filteredTrashbinData = trashbinData.filter((trashbin) => {
    if (
      !trashbin.coordinates ||
      trashbin.coordinates[0] === null ||
      trashbin.coordinates[1] === null ||
      trashbin.coordinates[0] < -90 ||
      trashbin.coordinates[0] > 90 ||
      trashbin.coordinates[1] < -180 ||
      trashbin.coordinates[1] > 180
    ) {
      return false;
    }
    const coordinateKey = `${trashbin.coordinates[0].toFixed(6)},${trashbin.coordinates[1].toFixed(6)}`;
    if (seenCoordinates.has(coordinateKey)) {
      return false;
    }
    seenCoordinates.add(coordinateKey);
    return true;
  });

  const addedMarkers = new Set<string>();
  for (const trashbin of filteredTrashbinData) {
    const coordinateKey = `${trashbin.coordinates[0].toFixed(6)},${trashbin.coordinates[1].toFixed(6)}`;

    if (addedMarkers.has(coordinateKey)) {
      continue; // Skip duplicates
    }
    addedMarkers.add(coordinateKey);
    // Check if required data is missing
    const isDataMissing =
      !trashbin.name ||
      !trashbin.coordinates ||
      trashbin.coordinates.length !== 2 ||
      !trashbin.sensors?.length;

    let allSensorsHaveOldData = false;

    if (!isDataMissing && trashbin.sensors?.length > 0) {
      const sensorData = await Promise.all(
        trashbin.sensors.map((sensorId) => fetchSensorHistory(sensorId))
      );

      // Check if all sensors lack recent data
      allSensorsHaveOldData = sensorData.every((historyData) =>
        historyData.every((data: { timestamp: Date }) => {
          const lastHistoryDate = new Date(data.timestamp);
       
          return lastHistoryDate.getTime() < threeDaysAgo.getTime();
        })
      );
    }
    const getIcon = (trashbin: Trashbin): any => {
      if (isDataMissing || allSensorsHaveOldData) {
        // Check if the bin is selected
        if (selectedBins?.some((bin) => bin.identifier === trashbin.identifier)) {
          return greyBinSelected; // Grey Bin Selected if selected and data is missing or old
        }    
        return greyBin; // Grey if missing data or all sensors have old data
      }
    
      // Return appropriate icon based on fill level and selection state
      if (selectedBins?.some((bin) => bin.identifier === trashbin.identifier)) {
        return trashbin.fillLevel < fillThresholds[0]
          ? greenBinSelected
          : trashbin.fillLevel < fillThresholds[1]
          ? yellowBinSelected
          : redBinSelected;
      }
    
      // Default bin icons
      return trashbin.fillLevel < fillThresholds[0]
        ? greenBin
        : trashbin.fillLevel < fillThresholds[1]
        ? yellowBin
        : redBin;
    };

    const marker = L.marker(
      [trashbin.coordinates[0] ?? 0, trashbin.coordinates[1] ?? 0],
      {
        icon: getIcon(trashbin),
      }
    );

    const container = document.createElement("div");
    const popupElement = (
      <PopupContent
        trashbin={trashbin}
        routePlanning={isRoutePlanning}
        fillThresholds={fillThresholds}
        batteryThresholds={batteryThresholds}
      />
    );
    createRoot(container).render(popupElement);
    marker.bindPopup(container);

    marker.on("mouseover", () => marker.openPopup());
    marker.on("click", () => {
      // Trigger the provided callback
      let selected = onTrashbinClick(trashbin);
      if (selected) {
        // Toggle selection state
        const isAlreadySelected = selectedBins?.some(
          (bin) => bin.identifier === trashbin.identifier
        );

        if (isAlreadySelected) {
          // Remove bin from selectedBins
          selectedBins = selectedBins?.filter(
            (bin) => bin.identifier !== trashbin.identifier
          );
        } else {
          // Add bin to selectedBins
          selectedBins = [...(selectedBins ?? []), trashbin];
        }

        // Update the marker's icon
        marker.setIcon(getIcon(trashbin));
      }
    });
    marker.on("popupopen", (e: any) => {
      L.DomEvent.on(e.popup._contentNode, "click", () => {
        onTrashbinClick(trashbin);
      });
    });

    markersRef.current.addLayer(marker); // Add marker to layer
  }
};

// Route handling
const handleRoutingControl = (L: any, showRoute: boolean = false, optimizedBins: Trashbin[] | undefined, tripStartEnd: LatLngTuple | undefined, mapRef: any, routingControlRef: any) => {
  if (routingControlRef.current && mapRef.current) {
    mapRef.current.removeControl(routingControlRef.current);
    routingControlRef.current = null;
  }

  if (mapRef.current && showRoute && tripStartEnd && optimizedBins && optimizedBins.length > 0) {
    const waypoints = [
      L.Routing.waypoint(L.latLng(tripStartEnd[0], tripStartEnd[1]), null, { allowUTurn: true }),
      ...optimizedBins.map(bin => L.Routing.waypoint(L.latLng(bin.coordinates[0], bin.coordinates[1]), null, { allowUTurn: true })),
      L.Routing.waypoint(L.latLng(tripStartEnd[0], tripStartEnd[1]), null, { allowUTurn: true }),
    ];

    routingControlRef.current = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: true,
      createMarker: () => null,
      show: false,
      allowUTurns: true,
      lineOptions: {
        addWaypoints: false
      }
    }).addTo(mapRef.current);
  }
};


const Map = ({
  trashbinData,
  centerCoordinates,
  initialZoom = 20,
  fillThresholds,
  batteryThresholds,
  isRoutePlanning,
  onTrashbinClick,
  tripStartEnd,
  selectedBins,
  optimizedBins,
  showRoute,
}: MapProps) => {
  const mapRef = useRef<null | L.Map>(null);
  const markersRef = useRef<null | L.MarkerClusterGroup>(null);
  const routingControlRef = useRef<null | L.Routing.Control>(null);

  // Map Initialization
  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current == null) {
      const L = require("leaflet");
      require("leaflet.markercluster");
      require("leaflet-routing-machine");
      initializeMap(L, centerCoordinates, initialZoom, mapRef, markersRef);
      addMarkersToMap(L,trashbinData,fillThresholds,batteryThresholds,selectedBins,isRoutePlanning,onTrashbinClick,markersRef);
    }
   
  }, [trashbinData,showRoute, optimizedBins, tripStartEnd,centerCoordinates, initialZoom,fillThresholds, batteryThresholds,selectedBins,isRoutePlanning,onTrashbinClick,markersRef]);
  // Route Handling
  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current) {
      const L = require("leaflet");
      require("leaflet.markercluster");
      require("leaflet-routing-machine");
      handleRoutingControl(L,showRoute,optimizedBins,tripStartEnd,mapRef,routingControlRef);
    }
  }, [showRoute, optimizedBins, tripStartEnd,centerCoordinates, initialZoom,  trashbinData,fillThresholds, batteryThresholds,selectedBins,isRoutePlanning,onTrashbinClick,markersRef]);

  return <div id="map" className="flex-grow h-full"></div>;
};

export default Map;

