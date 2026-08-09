import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Copy } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/use-contact";
import { useAuth } from "@/contexts/AuthContext";
import HoneypotField from "./HoneypotField";
import {
  simpleSubmissionSchema,
  type SimpleSubmissionFormData,
  type SimpleSubmissionType,
} from "@/lib/contact-schemas";

interface SimpleSubmissionFormProps {
  type: SimpleSubmissionType;
  onSuccess?: () => void;
}

const typeConfig: Record<
  SimpleSubmissionType,
  {
    title: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    successTitle: string;
    successMessage: string;
    showTicket: boolean;
  }
> = {
  feature: {
    title: "Feature Request",
    subjectPlaceholder: "Brief description of the feature",
    messagePlaceholder:
      "Describe the feature, the problem it solves, and how it would work",
    successTitle: "FEATURE REQUEST LOGGED.",
    successMessage: "Request logged. All submissions reviewed.",
    showTicket: true,
  },
  bug: {
    title: "Bug Report",
    subjectPlaceholder: "Brief description of the bug",
    messagePlaceholder:
      "What happened, what you expected, and steps to reproduce",
    successTitle: "BUG REPORT LOGGED.",
    successMessage: "Report logged. Under investigation.",
    showTicket: true,
  },
  beta: {
    title: "Beta Feedback",
    subjectPlaceholder: "Topic of your feedback",
    messagePlaceholder:
      "Your thoughts on the beta experience",
    successTitle: "FEEDBACK LOGGED.",
    successMessage: "Feedback logged.",
    showTicket: false,
  },
};

const SimpleSubmissionForm = ({ type, onSuccess }: SimpleSubmissionFormProps) => {
  const { user, profile } = useAuth();
  const { submitSimpleForm } = useContact();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const config = typeConfig[type];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SimpleSubmissionFormData>({
    resolver: zodResolver(simpleSubmissionSchema),
    defaultValues: {
      name: profile?.display_name || "",
      email: user?.email || "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: SimpleSubmissionFormData) => {
    try {
      const result = await submitSimpleForm.mutateAsync({ data, type, honeypot });
      if (result?.ticketNumber) {
        setTicketNumber(result.ticketNumber);
      }
      setSubmitted(true);
      toast({
        title: config.successTitle,
        description: config.successMessage,
      });
      reset();
      setHoneypot("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "SUBMISSION FAILED.",
        description:
          error instanceof Error ? error.message : "Retry when ready.",
        variant: "destructive",
      });
    }
  };

  const copyTicketNumber = () => {
    if (ticketNumber) {
      navigator.clipboard.writeText(ticketNumber);
      toast({
        title: "COPIED.",
        description: "Ticket number copied to clipboard.",
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-sf-emerald mx-auto mb-4" />
        <h3 className="font-heading text-xl font-medium mb-2">
          {config.successTitle}
        </h3>
        <p className="text-t3 mb-4">{config.successMessage}</p>
        {config.showTicket && ticketNumber && (
          <>
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-md mb-4">
              <span className="font-mono text-sm">{ticketNumber}</span>
              <Button variant="ghost" size="icon" onClick={copyTicketNumber} aria-label="Copy ticket number">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-t3 mb-4">
              Save this ticket number for your reference.
            </p>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setTicketNumber(null);
          }}
        >
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <HoneypotField
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}-name`}>CALLSIGN</Label>
          <div className="sf-input-bracketed">
            <Input
              id={`${type}-name`}
              placeholder="Your name"
              {...register("name")}
              disabled={isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-sf-crimson">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-email`}>FREQUENCY</Label>
          <div className="sf-input-bracketed">
            <Input
              id={`${type}-email`}
              type="email"
              placeholder="Your email"
              {...register("email")}
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-sf-crimson">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-subject`}>SIGNAL HEADER</Label>
        <div className="sf-input-bracketed">
          <Input
            id={`${type}-subject`}
            placeholder={config.subjectPlaceholder}
            {...register("subject")}
            disabled={isSubmitting}
          />
        </div>
        {errors.subject && (
          <p className="text-sm text-sf-crimson">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-message`}>TRANSMISSION</Label>
        <div className="sf-input-bracketed">
          <Textarea
            id={`${type}-message`}
            placeholder={config.messagePlaceholder}
            rows={5}
            {...register("message")}
            disabled={isSubmitting}
          />
        </div>
        {errors.message && (
          <p className="text-sm text-sf-crimson">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full gap-2"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader variant="inline" size="sm" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Submit {config.title}
      </Button>
    </form>
  );
};

export default SimpleSubmissionForm;
