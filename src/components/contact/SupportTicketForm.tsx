import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle, Copy } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/use-contact";
import { useAuth } from "@/contexts/AuthContext";
import HoneypotField from "./HoneypotField";
import {
  supportTicketSchema,
  type SupportTicketFormData,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/lib/contact-schemas";

interface SupportTicketFormProps {
  onSuccess?: () => void;
}

const SupportTicketForm = ({ onSuccess }: SupportTicketFormProps) => {
  const { user, profile } = useAuth();
  const { submitSupportTicket } = useContact();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      name: profile?.display_name || "",
      email: user?.email || "",
      category: undefined,
      priority: "normal",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: SupportTicketFormData) => {
    try {
      const result = await submitSupportTicket.mutateAsync({ ...data, honeypot });
      setTicketNumber(result.ticketNumber);
      setSubmitted(true);
      toast({
        title: "TICKET LOGGED.",
        description: `Your ticket number is ${result.ticketNumber}`,
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

  if (submitted && ticketNumber) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-heading text-xl font-semibold mb-2">
          TICKET LOGGED.
        </h3>
        <p className="text-muted-foreground mb-4">
          Response within 24-48 hours.
        </p>
        <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-md mb-4">
          <span className="font-mono text-sm">{ticketNumber}</span>
          <Button variant="ghost" size="icon" onClick={copyTicketNumber} aria-label="Copy ticket number">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Save this ticket number for your reference.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setTicketNumber(null);
          }}
        >
          NEW SUBMISSION
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
          <Label htmlFor="ticket-name">CALLSIGN</Label>
          <div className="sf-input-bracketed">
            <Input
              id="ticket-name"
              placeholder="Your name"
              {...register("name")}
              disabled={isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-email">FREQUENCY</Label>
          <div className="sf-input-bracketed">
            <Input
              id="ticket-email"
              type="email"
              placeholder="Your email"
              {...register("email")}
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticket-category">SYSTEM</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <SelectTrigger id="ticket-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-priority">ALERT LEVEL</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <SelectTrigger id="ticket-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((pri) => (
                    <SelectItem key={pri.value} value={pri.value}>
                      {pri.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.priority && (
            <p className="text-sm text-destructive">
              {errors.priority.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-subject">SIGNAL HEADER</Label>
        <div className="sf-input-bracketed">
          <Input
            id="ticket-subject"
            placeholder="Subject"
            {...register("subject")}
            disabled={isSubmitting}
          />
        </div>
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-message">TRANSMISSION</Label>
        <div className="sf-input-bracketed">
          <Textarea
            id="ticket-message"
            placeholder="Describe the issue"
            rows={5}
            {...register("message")}
            disabled={isSubmitting}
          />
        </div>
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
          <Loader variant="inline" size="sm" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        SUBMIT
      </Button>
    </form>
  );
};

export default SupportTicketForm;
