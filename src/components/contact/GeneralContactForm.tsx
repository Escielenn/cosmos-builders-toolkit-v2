import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContact } from "@/hooks/use-contact";
import { useAuth } from "@/contexts/AuthContext";
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
      await submitContactForm.mutateAsync(data);
      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">
          Message Sent!
        </h3>
        <p className="text-muted-foreground">We'll get back to you soon.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSubmitted(false)}
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          placeholder="Your name"
          {...register("name")}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          placeholder="How can we help?"
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
        Send Message
      </Button>
    </form>
  );
};

export default GeneralContactForm;
