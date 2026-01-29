import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useNotion } from "@/hooks/use-notion";

const NotionCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useNotion();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Notion...");

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
        setMessage("Connected! You can close this window.");
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
      <div className="text-center space-y-4 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg text-foreground">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-lg text-foreground">{message}</p>
            <button
              onClick={() => window.close()}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Close window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NotionCallback;
