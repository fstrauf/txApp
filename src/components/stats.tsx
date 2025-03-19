"use client";

import { useEffect, useRef } from "react";

type StatsProps = {
  income: number;
  expenses: number;
};

export function Stats({ income, expenses }: StatsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Data
    const total = income + expenses;
    const incomePercentage = total > 0 ? income / total : 0;
    const expensesPercentage = total > 0 ? expenses / total : 0;

    // Draw pie chart if there's data
    if (total > 0) {
      // Income (green)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        incomePercentage * Math.PI * 2,
        false
      );
      ctx.fillStyle = "#22c55e"; // green-500
      ctx.fill();

      // Expenses (red)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        incomePercentage * Math.PI * 2,
        Math.PI * 2,
        false
      );
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.fill();
    } else {
      // No data
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#e5e7eb"; // gray-200
      ctx.fill();
    }

    // Center circle (white)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111827"; // gray-900
    ctx.font = "bold 16px sans-serif";
    
    if (total > 0) {
      ctx.fillText(
        `${Math.round(incomePercentage * 100)}% / ${Math.round(
          expensesPercentage * 100
        )}%`,
        centerX,
        centerY
      );
    } else {
      ctx.fillText("No data", centerX, centerY);
    }
  }, [income, expenses]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas 
        ref={canvasRef} 
        width="200" 
        height="200"
        className="h-[200px] w-[200px]"
      />
      <div className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm">Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm">Expenses</span>
        </div>
      </div>
    </div>
  );
} 