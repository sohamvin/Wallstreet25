import React from "react";
import { Line } from "react-chartjs-2";

function LineChart({ chartData }) {
  return (
    <div className="chart-container" style={{ height: "350px" }}>
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: "",
            },
            legend: {
              display: false,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          elements: {
            point: {
              radius: 0,
            },
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              grid: {
                display: false
              }
            }
          }
        }}
      />
    </div>
  );
}

export default LineChart;
