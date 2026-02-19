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
import { Loader2, Send, CheckCircle, Copy } from "lucide-react";
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
        title: "Ticket submitted!",
        description: `Your ticket number is ${result.ticketNumber}`,
      });
      reset();
      setHoneypot("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to submit ticket",
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

  if (submitted && ticketNumber) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-heading text-xl font-semibold mb-2">
          Ticket Submitted!
        </h3>
        <p className="text-muted-foreground mb-4">
          We'll respond as soon as possible.
        </p>
        <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-md mb-4">
          <span className="font-mono text-sm">{ticketNumber}</span>
          <Button variant="ghost" size="icon" onClick={copyTicketNumber}>
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
          Submit Another Ticket
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
          <Label htmlFor="ticket-name">Name</Label>
          <Input
            id="ticket-name"
            placeholder="Your name"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-email">Email</Label>
          <Input
            id="ticket-email"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticket-category">Category</Label>
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
                  <SelectValue placeholder="Select category" />
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
          <Label htmlFor="ticket-priority">Priority</Label>
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
                  <SelectValue placeholder="Select priority" />
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
        <Label htmlFor="ticket-subject">Subject</Label>
        <Input
          id="ticket-subject"
          placeholder="Brief description of your issue"
          {...register("subject")}
          disabled={isSubmitting}
        />
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-message">Message</Label>
        <Textarea
          id="ticket-message"
          placeholder="Please describe your issue in detail..."
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
        Submit Ticket
      </Button>
    </form>
  );
};

export default SupportTicketForm;
