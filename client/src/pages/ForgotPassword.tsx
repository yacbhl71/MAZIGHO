import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/LocaleContext";
import { getAccountSecurityCopy } from "@/lib/accountSecurityCopy";

export default function ForgotPassword() {
  const { locale } = useLocale();
  const copy = getAccountSecurityCopy(locale);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const requestReset = trpc.auth.requestPasswordReset.useMutation({ onSuccess: result => { setEmailAvailable(result.emailAvailable); setSubmitted(true); }, onError: error => toast.error(error.message || copy.forgot.error) });
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); requestReset.mutate({ email }); };

  return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex-1 bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-20"><div className="container mx-auto max-w-md px-4"><Link href="/login" className="mb-6 flex w-fit items-center gap-2 font-medium text-orange-600 hover:text-orange-700"><ArrowLeft className="h-5 w-5" /> {copy.backToLogin}</Link><Card><CardContent className="p-7 md:p-8"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600"><Mail className="h-7 w-7" /></div><h1 className="text-center text-2xl font-semibold text-gray-800">{copy.forgot.title}</h1><p className="mt-2 text-center text-sm text-gray-600">{copy.forgot.lead}</p>{submitted ? <div className="mt-7 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900"><p>{emailAvailable ? copy.forgot.sent : copy.forgot.unavailable}</p></div> : <form className="mt-7 space-y-5" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="reset-email">{copy.email}</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.ch" required /></div><Button type="submit" disabled={requestReset.isPending} className="w-full bg-orange-500 text-white hover:bg-orange-600">{requestReset.isPending ? copy.forgot.sending : copy.forgot.send}</Button></form>}</CardContent></Card><div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" /><p>{copy.forgot.security}</p></div></div></main><Footer /></div>;
}
