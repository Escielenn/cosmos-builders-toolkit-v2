import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/use-contact";
import { useAuth } from "@/contexts/AuthContext";
import HoneypotField from "./HoneypotField";
import {
  generalContactSchema,
  type GeneralContactFormData,
} from "@/lib/contact-schemas";

interface GeneralContactFormProps {
  onSuccess?: () => void;
}

const GeneralContactForm = ({ onSuccess }: GeneralContactFormProps) => {
  const { user, profile } = useAuth();
  const { submitContactForm } = useContact();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GeneralContactFormData>({
    resolver: zodResolver(generalContactSchema),
    defaultValues: {
      name: profile?.display_name || "",
      email: user?.email || "",
      message: "",
    },
  });

  const onSubmit = async (data: GeneralContactFormData) => {
    try {
      await submitContactForm.mutateAsync({ ...data, honeypot });
      setSubmitted(true);
      toast({
        title: "TRANSMISSION RECEIVED.",
        description: "Response within 24-48 hours.",
      });
      reset();
      setHoneypot("");
      onSuccess?.();
    } catch (error) {
      toast({
        title: "TRANSMISSION FAILED.",
        description:
          error instanceof Error ? error.message : "Retry when ready.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-sf-emerald mx-auto mb-4" />
        <h3 className="font-heading text-xl font-medium mb-2">
          TRANSMISSION RECEIVED.
        </h3>
        <p className="text-t3">Response within 24-48 hours.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          NEW TRANSMISSION
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

      <div className="space-y-2">
        <Label htmlFor="contact-name">CALLSIGN</Label>
        <div className="sf-input-bracketed">
          <Input
            id="contact-name"
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
        <Label htmlFor="contact-email">FREQUENCY</Label>
        <div className="sf-input-bracketed">
          <Input
            id="contact-email"
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

      <div className="space-y-2">
        <Label htmlFor="contact-message">TRANSMISSION</Label>
        <div className="sf-input-bracketed">
          <Textarea
            id="contact-message"
            placeholder="Your message"
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
        TRANSMIT
      </Button>
    </form>
  );
};

export default GeneralContactForm;
