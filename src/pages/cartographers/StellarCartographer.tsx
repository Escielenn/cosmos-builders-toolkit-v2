import { lazy, Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { useMetaTags } from "@/hooks/use-meta-tags";
import Header from "@/components/layout/Header";

const StellarCartographerComponent = lazy(
  () => import("@/components/tools/StellarCartographer")
);

const SimLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-background">
    <Loader message="LOADING STELLAR CARTOGRAPHER" />
  </div>
);

const StellarCartographer = () => {
  useMetaTags({ title: "Stellar Cartographer" });
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0 }}>
        <Suspense fallback={<SimLoader />}>
          <StellarCartographerComponent />
        </Suspense>
      </div>
    </div>
  );
};

export default StellarCartographer;
