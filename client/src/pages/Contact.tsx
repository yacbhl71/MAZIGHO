import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/LocaleContext";
import { getMarketingCopy } from "@/lib/marketingCopy";

export default function Contact() {
  const { locale } = useLocale();
  const copy = getMarketingCopy(locale).contact;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const sendMessage = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success(copy.sent, {
        description: copy.sentDescription,
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => {
      toast.error(copy.failed, {
        description: copy.failedDescription,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(copy.required);
      return;
    }
    sendMessage.mutate({
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim() || undefined,
      message: formData.message.trim(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {copy.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {copy.lead}
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    {copy.infoTitle}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {copy.infoLead}
                  </p>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{copy.formCardTitle}</h3>
                        <p className="text-muted-foreground">{copy.formCardText}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Send className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{copy.followUpTitle}</h3>
                        <p className="text-muted-foreground">{copy.followUpText}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">
                      {copy.formTitle}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{copy.name} *</Label>
                          <Input
                            id="name"
                            placeholder={copy.namePlaceholder}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{copy.email} *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">{copy.subject}</Label>
                        <Input
                          id="subject"
                          placeholder={copy.subjectPlaceholder}
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{copy.message} *</Label>
                        <Textarea
                          id="message"
                          placeholder={copy.messagePlaceholder}
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={sendMessage.isPending}
                      >
                        {sendMessage.isPending ? (
                          <>{copy.sending}</>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            {copy.send}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
