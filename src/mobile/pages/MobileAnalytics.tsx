import AnalyticsPanel from "@/components/AnalyticsPanel";

const MobileAnalytics = () => {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance overview</p>
      </header>

      <AnalyticsPanel />
    </div>
  );
};

export default MobileAnalytics;

