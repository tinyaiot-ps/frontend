import React, { useRef, useEffect, useState } from "react";
import ResizeObserver from "resize-observer-polyfill";
import * as d3 from "d3";
import { useTheme } from "../lib/ThemeContext"; // Adjusted import path for ThemeContext

interface DataItem {
  timestamp: Date;
  measurement: number;
}

interface LineChartProps {
  historyData: DataItem[];
  green: [number, number];
  yellow: [number, number];
  red: [number, number];
}

function determineColor(d: number, green: [number, number], yellow: [number, number], red: [number, number]) {
  if (d >= green[0] && d <= green[1]) return "green";
  if (d >= yellow[0] && d < yellow[1]) return "yellow";
  if (d >= red[0] && d <= red[1]) return "red";
  return "black";
}

const LineChart: React.FC<LineChartProps> = ({ historyData, green, yellow, red }) => {
  const yAxisRef = useRef<SVGSVGElement>(null);
  const mainChartRef = useRef<SVGSVGElement>(null);
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    const currentRef = mainChartRef.current;
    if (currentRef) {
      resizeObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (!mainChartRef.current) return;

    
    const margin = { top: 5, right: 5, bottom: 130, left: 90 }; // Increase left margin

    

    const height = dimensions.height - margin.top - margin.bottom;
    //const fullWidth = dimensions.width - margin.left - margin.right;

    
    //const height = Math.max(dimensions.height - margin.top - margin.bottom, 400); // Ensure a decent height
    const fullWidth = Math.max(dimensions.width - margin.left - margin.right, 800); // Ensure a minimum width

    d3.select(mainChartRef.current).selectAll("*").remove();

    const svg = d3
      .select(mainChartRef.current)
      .attr("width", fullWidth + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const timeDomain = d3.extent(historyData, d => d.timestamp) as [Date, Date];
    const x = d3.scaleTime()
      .domain(timeDomain)
      .range([0, fullWidth]);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    const sortedData = [...historyData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const line = d3.line<DataItem>()
      .x(d => x(d.timestamp))
      .y(d => y(d.measurement))
      .curve(d3.curveMonotoneX);

    const xAxis = d3.axisBottom(x)
      .tickFormat((domainValue) => d3.timeFormat('%Y-%m-%d %H:%M')(domainValue as Date))
      .ticks(10);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)') // Rotate text to avoid overlap
      .style('text-anchor', 'end')
      .attr('dx', '-.8em');

    // Color range bands
    svg.append("rect")
      .attr("x", 0)
      .attr("y", y(green[1]))
      .attr("width", fullWidth)
      .attr("height", y(green[0]) - y(green[1]))
      .attr("fill", "green")
      .attr("opacity", 0.15);

    svg
        .append("rect")
      .attr("x", 0)
      .attr("y", y(yellow[1]))
      .attr("width", fullWidth)
      .attr("height", y(yellow[0]) - y(yellow[1]))
      .attr("fill", "yellow")
      .attr("opacity", 0.15);

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", y(red[1]))
      .attr("width", fullWidth)
      .attr("height", y(red[0]) - y(red[1]))
      .attr("fill", "red")
      .attr("opacity", 0.15);

    svg
      .append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    svg
      .selectAll(".dot")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("stroke", "black")
      .attr("fill", d => determineColor(d.measurement, green, yellow, red))
      .attr("cx", d => x(d.timestamp))
      .attr("cy", d => y(d.measurement))
      .attr("r", 3);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #ccc')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    svg
      .selectAll('.dot-overlay')
      .data(sortedData)
      .enter().append('circle')
      .attr('class', 'dot-overlay')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.measurement))
      .attr('r', 10)
      .style('opacity', 0)
      .style('fill', d => determineColor(d.measurement, green, yellow, red))
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', .95);
        tooltip.html(`Timestamp: ${d3.timeFormat('%Y-%m-%d %H:%M')(d.timestamp)}<br/>Measurement: ${Math.round(d.measurement)}%`)
          .style('left', `${event.pageX - 260}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Y-Axis
    d3.select(yAxisRef.current).selectAll("*").remove();
    const yAxis = d3.axisLeft(y)
      .tickValues([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
      .tickFormat(d => `${d}%`);

    d3.select(yAxisRef.current)
      .attr("width", margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left - 1},${margin.top})`)
      .call(yAxis);
      // Remove the domain (the line) from the static y-axis
      d3.select(yAxisRef.current).select(".domain").remove();
      
      // Remove the static ticks (labels and tick marks)
     d3.select(yAxisRef.current).selectAll(".tick").remove(); 


    // Step 2: Render Y-Axis LINE inside the scrollable chart (Moves with scroll)
    svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(-1, 0)`) // Move slightly left for alignment
    .call(yAxis);
    

  }, [dimensions, historyData, green, yellow, red]);

  // Ensure scrolling behavior after chart resizing
  useEffect(() => {
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollLeft = scrollableDivRef.current.scrollWidth;
    }
  }, [dimensions]);

  return (
    <div className="relative w-full h-[500px]"> {/* Increase height */}
      <svg ref={yAxisRef} className="absolute left-0 top-0 h-full"></svg>
      <div className="overflow-x-scroll h-full ml-10 bg-transparent" ref={scrollableDivRef}>
        <svg ref={mainChartRef} className="block h-full -ml-10"></svg>
      </div>
    </div>
  );
};

export default LineChart;
