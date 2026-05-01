import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const ExoforgeScience = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <iframe
        src="/tools/exoforge/science.html"
        title="Exoforge, The Science"
        className="flex-1 w-full border-0"
        style={{ marginTop: 64, minHeight: "calc(100vh - 64px)" }}
      />
      <Footer />
    </div>
  );
};

export default ExoforgeScience;
