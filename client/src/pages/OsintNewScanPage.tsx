import OsintEngine from "../components/dashboard/OsintEngine";

const OsintNewScanPage = () => {
  return (
    <div className="w-full min-h-screen bg-darkGray p-8">
      <OsintEngine mode="new" />
    </div>
  );
};

export default OsintNewScanPage;
