import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle, Copy } from "lucide-react";
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
      "Describe the feature you'd like to see. What problem would it solve? How would it work?",
    successTitle: "Feature Request Submitted!",
    successMessage: "Thank you for your suggestion. We review all feature requests.",
    showTicket: true,
  },
  bug: {
    title: "Bug Report",
    subjectPlaceholder: "Brief description of the bug",
    messagePlaceholder:
      "Please describe what happened, what you expected to happen, and steps to reproduce the issue.",
    successTitle: "Bug Report Submitted!",
    successMessage: "Thank you for reporting this issue. We'll investigate it.",
    showTicket: true,
  },
  beta: {
    title: "Beta Feedback",
    subjectPlaceholder: "What's your feedback about?",
    messagePlaceholder:
      "Share your thoughts on the beta experience. What do you like? What could be improved?",
    successTitle: "Feedback Submitted!",
    successMessage: "Thank you for your beta feedback!",
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
        title: "Failed to submit",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyTicketNumber = () => {
    if (ticketNumber) {
      navigator.clipboard.writeText(ticketNumber);
      toast({
        title: "Copied!",
        description: "Ticket number copied to clipboard.",
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-heading text-xl font-semibold mb-2">
          {config.successTitle}
        </h3>
        <p className="text-muted-foreground mb-4">{config.successMessage}</p>
        {config.showTicket && ticketNumber && (
          <>
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-md mb-4">
              <span className="font-mono text-sm">{ticketNumber}</span>
              <Button variant="ghost" size="icon" onClick={copyTicketNumber}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
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
          <Label htmlFor={`${type}-name`}>Name</Label>
          <Input
            id={`${type}-name`}
            placeholder="Your name"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-email`}>Email</Label>
          <Input
            id={`${type}-email`}
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-subject`}>Subject</Label>
        <Input
          id={`${type}-subject`}
          placeholder={config.subjectPlaceholder}
          {...register("subject")}
          disabled={isSubmitting}
        />
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-message`}>Message</Label>
        <Textarea
          id={`${type}-message`}
          placeholder={config.messagePlaceholder}
          rows={5}
          {...register("message")}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full gap-2"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Submit {config.title}
      </Button>
    </form>
  );
};

export default SimpleSubmissionForm;
