// Component inspired by: https://www.react-graph-gallery.com/heatmap
"use client";

import { useState, useRef, useEffect } from "react";
import { Renderer } from "./Renderer";
import { Tooltip } from "./Tooltip";
import { COLOR_LEGEND_HEIGHT } from "./constants";
import { ColorLegend } from "./ColorLegend";
import * as d3 from "d3";
import { COLORS, MARGIN, THRESHOLDS } from "./constants";
import { useTheme } from "@/lib/ThemeContext"; // Theme hook

type HeatmapProps = {
  data: {
    time: number; // Unix timestamp
    percentage: number; // (10, 20, 30, ..., 90, 100)
    amount: number;
  }[];
};

export type InteractionData = {
  xLabel: string;
  yLabel: string;
  xPos: number;
  yPos: number;
  value: number | null;
};

const YAxis = ({ yGroups = [], height, isDarkMode }: { yGroups: string[]; height: number; isDarkMode: boolean}) => {
  const yScale = d3
    .scaleBand<string>()
    .range([0, height - MARGIN.top - MARGIN.bottom])
    .domain(yGroups)
    .padding(0.1);

  const yLabels = yGroups.map((name, i) => {
    const yPos = yScale(name);
    if (yPos === undefined) return null; // Guard against undefined yPos

    const displayText = `${Number(name) - 25}-${name}%`;
    return (
      <text
        key={i}
        x={-5}
        y={yPos + yScale.bandwidth() / 2 || 0} // Ensure yPos is valid
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={9}
        fill={isDarkMode ? "#FFFFFF" : "#000000"} // Apply dynamic color
      >
        {displayText}
      </text>
    );
  });

  return (
    <svg width={MARGIN.left} height={height} className="absolute left-0 top-0">
      <g transform={`translate(${MARGIN.left - 1},${MARGIN.top})`}>
        {yLabels}
      </g>
    </svg>
  );
};


export const Heatmap = ({ data }: HeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<InteractionData | null>(null);
  const [scaleBandWidth, setScaleBandWidth] = useState<number>(0);
  const scrollableDivRef = useRef<HTMLDivElement>(null);

  const maxAmount = data.length ? Math.max(...data.map((obj) => obj.amount)) : 0;
const thresholds = maxAmount
  ? [0, Math.ceil(maxAmount / 5), Math.ceil((maxAmount * 2) / 5), Math.ceil((maxAmount * 3) / 5), Math.ceil((maxAmount * 4) / 5), Math.ceil(maxAmount)]
  : [0, 1, 2, 3, 4, 5];
const colorScale = d3
  .scaleLinear<string>()
  .domain(thresholds)
  .range(COLORS);
  
  //const { isDarkMode = false  } = useTheme(); // Retrieve theme
  const { theme, toggleTheme } = useTheme();  // Use theme directly
  const isDarkMode = theme === "dark";  // Check if theme is dark mode

  const allYGroups = Array.from(new Set(data.map(d => d.percentage)))
    .sort((a, b) => b - a)
    .map(String);

  // Scroll to the right when the component is mounted to see the latest data
  useEffect(() => {
    if (!data.length) {
      setScaleBandWidth(0);
      return;
    }
    
    const dates = data.map((r) => new Date(r.time).setHours(0, 0, 0, 0));
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    
    // Ensure valid date range before calculating scaleBandWidth
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      setScaleBandWidth((endDate.getTime() - startDate.getTime()) / 86400000);
    } else {
      setScaleBandWidth(0);
    }
  }, [data]);
  
  return (
    <div className="relative w-full h-[400px]">
    <YAxis yGroups={allYGroups} height={340} isDarkMode={isDarkMode}/>
      <div className="overflow-x-scroll h-[340px] ml-12" ref={scrollableDivRef}>
        <div className="relative">
        <Renderer
            width={isNaN(scaleBandWidth) ? 0 : scaleBandWidth * 40} // Avoid NaN
            height={340}
            data={data}
            setHoveredCell={setHoveredCell}
            colorScale={colorScale}
            isDarkMode={isDarkMode} // Pass dark mode state
          />

          <Tooltip
            interactionData={hoveredCell}
            width={data.length * 2}
            height={340 - COLOR_LEGEND_HEIGHT}
          />
          </div>
        </div>
      <div className="w-full flex justify-center">
          <ColorLegend
            height={COLOR_LEGEND_HEIGHT}
            width={250}
            colorScale={colorScale}
            thresholds={thresholds}
          />
      </div>
    </div>
  );
};
