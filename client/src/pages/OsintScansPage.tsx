import OsintEngine from "../components/dashboard/OsintEngine";

const OsintScansPage = () => {
  return (
    <div className="w-full min-h-screen bg-darkGray p-8">
      <OsintEngine mode="scans" />
    </div>
  );
};

export default OsintScansPage;
