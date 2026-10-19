import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useNotion } from "@/hooks/use-notion";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { PageHeader } from "@/components/layout/page-chrome";

const NotionCallback = () => {
  useMetaTags({ title: "Notion Link" });
  const [searchParams] = useSearchParams();
  const { handleCallback } = useNotion();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("ESTABLISHING NOTION LINK...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(error === "access_denied" ? "Access denied" : "Authorization failed");
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorization code");
      return;
    }

    handleCallback(code, state).then((result) => {
      if (result.success) {
        setStatus("success");
        setMessage("CONNECTION ESTABLISHED. Close window.");
        // Auto-close after a moment
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.error || "Connection failed");
      }
    });
  }, [searchParams, handleCallback]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main id="main" tabIndex={-1} className="w-full max-w-md p-8 text-center">
        <PageHeader
          size="card"
          align="center"
          accent={status === "error" ? "crimson" : status === "success" ? "emerald" : "primary"}
          eyebrow="NOTION LINK"
          icon={
            status === "loading" ? (
              <Loader />
            ) : status === "success" ? (
              <CheckCircle2 className="w-12 h-12 text-sf-emerald" aria-hidden />
            ) : (
              <XCircle className="w-12 h-12 text-sf-crimson" aria-hidden />
            )
          }
          title={
            status === "loading" ? "Linking Notion" : status === "success" ? "Notion linked" : "Notion link failed"
          }
          lede={<span role={status === "error" ? "alert" : "status"}>{message}</span>}
        />
        {status === "error" && (
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex min-h-hit items-center text-sm text-t3 underline hover:text-t1"
          >
            Close window
          </button>
        )}
      </main>
    </div>
  );
};

export default NotionCallback;
