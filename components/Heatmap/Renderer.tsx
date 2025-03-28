import { useMemo } from "react";
import * as d3 from "d3";
import { InteractionData } from "./Heatmap";
import { MARGIN } from "./constants";

type Dataset = {
  time: number; // Unix timestamp
  percentage: number; // (10, 20, 30, ..., 90, 100)
  amount: number;
}[];

type RendererProps = {
  width: number;
  height: number;
  data: Dataset;
  setHoveredCell: (hoveredCell: InteractionData | null) => void;
  colorScale: d3.ScaleLinear<string, string, never>;
  isDarkMode: boolean; // Dark mode added
};

export const Renderer = ({
  width,
  height,
  data,
  setHoveredCell,
  colorScale,
  isDarkMode, // Added Dark mode here
}: RendererProps) => {
  // bounds = area inside the axis
  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const allYGroups = useMemo(() => {
  // Convert percentages to numbers, sort them in descending order, and convert back to strings
  return Array.from(new Set(data.map(d => d.percentage)))
    .sort((a, b) => b - a) // Sort in descending order
    .map(String); // Convert back to strings if necessary
}, [data]);

  const allXGroups = useMemo(() => Array.from(new Set(data.map((d) => new Date(d.time).toDateString()).filter(Boolean))), [data]);

  const xScale = useMemo(() => {
    return d3
      .scaleBand()
      .range([0, boundsWidth])
      .domain(allXGroups)
      .padding(0.1);
  }, [allXGroups, boundsWidth]);

  const yScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .range([0, boundsHeight])
      .domain(allYGroups)
      .padding(0.1);
  }, [allYGroups, boundsHeight]);

  const allRects = data.map((d, i) => {
    const xPos = xScale(new Date(d.time).toDateString());
    const yPos = yScale(d.percentage?.toString());

    if (d.amount === null || !xPos || !yPos) {
      return null;
    }

    return (
    
      <rect
        key={i}
        x={xPos}
        y={yPos}
        className="rectangle"
        width={xScale.bandwidth()}
        height={yScale.bandwidth()}
        fill={colorScale(d.amount)}
        onMouseEnter={(e) => {
          setHoveredCell({
            xLabel: new Date(d.time).toDateString(),
            yLabel: d.percentage?.toString() || "",
            xPos: xPos + xScale.bandwidth(),
            yPos: yPos + yScale.bandwidth(),
            value: Math.round(d.amount * 100) / 100,
          });
        }}
      />
    
    );
  });

  const xLabels = allXGroups.map((name, i) => {
    if (name && new Date(name).getDate() % 7 === 0) { // Show every 7th date
      return (
        <text
          key={i}
          x={xScale(name)}
          y={boundsHeight + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          stroke="none"
          fill={isDarkMode ? "#FFFFFF" : "#000000"} // Dynamic color
         
        >
          {name}
        </text>
      );
    }
    return null;
  });

  return (
    <svg
      width={width}
      height={height}
      onMouseLeave={() => setHoveredCell(null)}
      className="-ml-12"
      style={{ fill: isDarkMode ? "#FFFFFF" : "#000000" }} // Set global fill for the entire SVG
    >
      <g
        width={boundsWidth}
        height={boundsHeight}
        transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
      >
        {allRects}
        {xLabels}
      </g>
    </svg>
  );
};
