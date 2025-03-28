import { Trashbin } from "@/app/types";
import { Heatmap } from "./Heatmap";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
;

type Entry = {
  time: number; // Unix timestamp
  percentage: number; // (10, 20, 30, ..., 90, 100)
  amount: number;
};

interface Measurement {
  timestamp: Date;
  measurement: number;
  binName: string;
  type: string;
}


export const HeatmapBatteryLevel: React.FC<{ trashbins: Trashbin[] }> = ({trashbins}) => {
  const [realData, setRealData] = useState<Entry[]>([]);
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        let newMeasurements: Measurement[] = [];
        if(trashbins.length>0){
          const historyPromises = trashbins.flatMap(bin => 
            bin.sensors.map(sensor => ({
              binIdentifier: bin.identifier,
                promise: axios.get(
                  `/api/v1/history/sensor/${sensor}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token?.replace(/"/g, "")}`,
                    },
                  }
                )
            }))
          );
          
          const history = await Promise.all(historyPromises.map(async item => ({
              binIdentifier: item.binIdentifier,
              data: await item.promise
          })));

          newMeasurements = history.flatMap(sensorHistories => 
              sensorHistories.data.data.map((sensorHistory: { createdAt: any; measurement: any; measureType: any; }) => ({
                  binName: sensorHistories.binIdentifier,
                  timestamp: sensorHistory.createdAt,
                  measurement: sensorHistory.measurement,
                  type: sensorHistory.measureType
              }))
          ).filter(reading => reading.type == "battery_level");;
          
        }
        
        if(newMeasurements.length>0) {
          // Generate Heatmap Data
          const dates = newMeasurements.map(r => new Date(r.timestamp).setHours(23,59,59,0));
          const startDate = new Date(Math.min(...dates));
          const endDate = new Date(Math.max(...dates));
          
          // Create array of all days between start and end
          const dailySummaries: Entry[] = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            // Get all readings before this day for each unique sensor
            const relevantDate = currentDate.getTime();
            const sensorLatestReadings = new Map<string, number>();
            
            newMeasurements
              .filter(reading => new Date(reading.timestamp).getTime() <= relevantDate)
              .forEach(reading => {
                // Keep only the latest reading for each sensor
                sensorLatestReadings.set(reading.binName, reading.measurement);
              });
            
            // Count sensors in each fill range
            const fills = Array.from(sensorLatestReadings.values());
            
            dailySummaries.push({
              time: currentDate.getTime(),
              percentage: 25,
              amount: fills.filter(fill => fill >= 0 && fill < 25).length
            });
            dailySummaries.push({
              time: currentDate.getTime(),
              percentage: 50,
              amount: fills.filter(fill => fill >= 25 && fill < 50).length
            });
            dailySummaries.push({
              time: currentDate.getTime(),
              percentage: 75,
              amount: fills.filter(fill => fill >= 50 && fill < 75).length
            });
            dailySummaries.push({
              time: currentDate.getTime(),
              percentage: 100,
              amount: fills.filter(fill => fill >= 75 && fill <= 100).length
            });
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
          setRealData(realData => [
            ...realData,
            ...dailySummaries
          ])
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push('/login');
        }
      }
    };
    fetchData();
  }, [trashbins, router]);
  return <Heatmap data={realData} />
};
