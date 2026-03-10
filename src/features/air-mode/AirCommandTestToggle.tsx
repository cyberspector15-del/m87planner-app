/**
 * TEMPORARY TEST COMPONENT
 * for Phase 2 verification
 */
import React from "react";
import { useAirMode } from "@/features/air-mode/AirModeProvider";
import { Button } from "@/components/ui/button";
import { Activity, Hand, X } from "lucide-react";

export function AirCommandTestToggle() {
    const { startTracking, stopTracking, isWorkerReady, handDetected } = useAirMode();
    const [isActive, setIsActive] = React.useState(false);

    const handleToggle = async () => {
        if (isActive) {
            stopTracking();
            setIsActive(false);
        } else {
            await startTracking();
            setIsActive(true);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000000 }}>
            <Button
                onClick={handleToggle}
                variant={isActive ? "destructive" : "default"}
                className="gap-2 shadow-lg"
            >
                {isActive ? <X size={16} /> : <Hand size={16} />}
                {isActive ? "Stop Air Mode" : "Test Air Mode"}
                {isActive && isWorkerReady && (
                    <Activity size={12} className={handDetected ? "text-green-400 animate-pulse" : "text-red-400"} />
                )}
            </Button>
        </div>
    );
}
