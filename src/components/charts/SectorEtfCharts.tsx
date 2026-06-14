"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { sectorEtfData } from "@/data/sector-etf-data";

const tooltipStyle = {
  backgroundColor: "#141414",
  border: "1px solid #262626",
  borderRadius: "8px",
  fontSize: "13px",
};

export function SpreadChart() {
  return (
    <div className="my-6 p-4 rounded-lg border border-[#262626] bg-[#111]">
      <h4 className="text-sm font-semibold text-[#f5f5f5] mb-1">
        XLK – β×XLI Spread
      </h4>
      <p className="text-xs text-[#737373] mb-3">
        Spread oscillates around 0 — mean-reverting behavior confirms cointegration.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sectorEtfData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            interval={11}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#525252" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="spread"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            name="Spread"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ZScoreChart() {
  return (
    <div className="my-6 p-4 rounded-lg border border-[#262626] bg-[#111]">
      <h4 className="text-sm font-semibold text-[#f5f5f5] mb-1">
        Rolling Z-Score (30-day)
      </h4>
      <p className="text-xs text-[#737373] mb-3">
        Z-score crosses ±2 bands = entry signals. Reverts to 0 = exit. This is the pairs trading signal.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sectorEtfData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            interval={11}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[-3.5, 3.5]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine
            y={2}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: "+2σ", fill: "#ef4444", fontSize: 11, position: "right" }}
          />
          <ReferenceLine
            y={-2}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: "-2σ", fill: "#ef4444", fontSize: 11, position: "right" }}
          />
          <ReferenceLine y={0} stroke="#525252" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="zScore"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Z-Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
