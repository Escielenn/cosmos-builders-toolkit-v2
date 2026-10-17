import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useMetaTags } from "@/hooks/use-meta-tags";

const TidelockScience = () => {
  useMetaTags({ title: "Tidelock: The Science" });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <iframe
        src="/tools/tidelock/science.html"
        title="Tidelock, The Science"
        className="flex-1 w-full border-0"
        style={{ marginTop: 64, minHeight: "calc(100vh - 64px)" }}
      />
      <Footer />
    </div>
  );
};

export default TidelockScience;
