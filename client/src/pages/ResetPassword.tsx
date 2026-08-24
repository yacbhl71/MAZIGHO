import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
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

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { locale } = useLocale();
  const copy = getAccountSecurityCopy(locale);
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const completeReset = trpc.auth.completePasswordReset.useMutation({ onSuccess: () => { toast.success(copy.reset.success); setLocation("/login"); }, onError: error => toast.error(error.message || copy.reset.expired) });
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!token) { toast.error(copy.reset.invalid); return; } if (password !== confirmation) { toast.error(copy.reset.mismatch); return; } completeReset.mutate({ token, password }); };

  return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex-1 bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-20"><div className="container mx-auto max-w-md px-4"><Link href="/login" className="mb-6 flex w-fit items-center gap-2 font-medium text-orange-600 hover:text-orange-700"><ArrowLeft className="h-5 w-5" /> {copy.backToLogin}</Link><Card><CardContent className="p-7 md:p-8"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600"><KeyRound className="h-7 w-7" /></div><h1 className="text-center text-2xl font-semibold text-gray-800">{copy.reset.title}</h1><p className="mt-2 text-center text-sm text-gray-600">{copy.reset.lead}</p><form className="mt-7 space-y-5" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="new-password">{copy.reset.newPassword}</Label><div className="relative"><Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required className="pr-11" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? copy.hide : copy.show}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div className="space-y-2"><Label htmlFor="confirm-password">{copy.reset.confirm}</Label><Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={8} required /></div><Button type="submit" disabled={completeReset.isPending || !token} className="w-full bg-orange-500 text-white hover:bg-orange-600">{completeReset.isPending ? copy.reset.saving : copy.reset.save}</Button></form>{!token && <p className="mt-4 text-center text-sm text-destructive">{copy.reset.invalid}</p>}</CardContent></Card></div></main><Footer /></div>;
}
