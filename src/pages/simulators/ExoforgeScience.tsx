import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useMetaTags } from "@/hooks/use-meta-tags";

const ExoforgeScience = () => {
  useMetaTags({ title: "ExoForge: The Science" });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col">
        <iframe
          src="/tools/exoforge/science.html"
          title="Exoforge, The Science"
          className="flex-1 w-full border-0"
          style={{ marginTop: 64, minHeight: "calc(100vh - 64px)" }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ExoforgeScience;
