"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { qqqVooData } from "@/data/qqq-voo-data";

const tooltipStyle = {
  backgroundColor: "#141414",
  border: "1px solid #262626",
  borderRadius: "8px",
  fontSize: "13px",
};

export function NormalizedPriceChart() {
  return (
    <div className="my-6 p-4 rounded-lg border border-[#262626] bg-[#111]">
      <h4 className="text-sm font-semibold text-[#f5f5f5] mb-1">
        Normalized Adj Close (base = 1)
      </h4>
      <p className="text-xs text-[#737373] mb-3">
        QQQ outperforms VOO structurally — both trend up, but the gap widens.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={qqqVooData}>
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
            domain={[0.5, 3.2]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#a3a3a3" }}
          />
          <Line
            type="monotone"
            dataKey="qqq"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            name="QQQ"
          />
          <Line
            type="monotone"
            dataKey="voo"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            name="VOO"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatioChart() {
  return (
    <div className="my-6 p-4 rounded-lg border border-[#262626] bg-[#111]">
      <h4 className="text-sm font-semibold text-[#f5f5f5] mb-1">
        QQQ / VOO Ratio
      </h4>
      <p className="text-xs text-[#737373] mb-3">
        Ratio trends upward from ~1.0 to ~1.4 — not mean-reverting. This is why cointegration fails.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={qqqVooData}>
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
            domain={[0.85, 1.55]}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="ratio"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            name="QQQ/VOO Ratio"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
