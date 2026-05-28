import RoutineList from "@/components/RoutineList";

const MobileRoutines = () => {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Routines</h1>
        <p className="text-sm text-muted-foreground">Your recurring missions</p>
      </header>

      <RoutineList />
    </div>
  );
};

export default MobileRoutines;

