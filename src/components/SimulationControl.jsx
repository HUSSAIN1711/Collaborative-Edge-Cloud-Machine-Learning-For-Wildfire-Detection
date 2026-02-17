import React, { useState } from "react";
import { Box } from "@mui/material";
import useAppStore from "../store/useAppStore";
import DashboardPanel from "./DashboardPanel";
import PanelTitle from "./panel/PanelTitle";
import TextOption from "./panel/TextOption";

function SimulationControl() {
  const simulationTimestamp = useAppStore((s) => s.simulationTimestamp);
  const jumpToTick = useAppStore((s) => s.jumpToTick);
  const [inputValue, setInputValue] = useState("");

  const handleGo = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      jumpToTick(parsed);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleGo();
  };

  return (
    <DashboardPanel sx={{ mb: 1 }}>
      <PanelTitle title="Simulation" />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="span"
          sx={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: "12px",
            color: "#888",
          }}
        >
          Tick
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: "Roboto Mono, monospace",
            fontSize: "12px",
            color: "#fff",
            minWidth: "32px",
          }}
        >
          {simulationTimestamp}
        </Box>
        <input
          type="number"
          min="0"
          placeholder="t"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "60px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "3px",
            color: "#fff",
            fontFamily: "Roboto Mono, monospace",
            fontSize: "12px",
            padding: "2px 6px",
            outline: "none",
          }}
        />
        <TextOption label="Go" selected={false} onClick={handleGo} />
      </Box>
    </DashboardPanel>
  );
}

export default SimulationControl;
