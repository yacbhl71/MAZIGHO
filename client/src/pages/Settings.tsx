import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, Mail, User, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { getAccountStatusCopy } from "@/lib/accountStatusCopy";
import { getAccountSecurityCopy } from "@/lib/accountSecurityCopy";

export default function SettingsPage() {
  const { isAuthenticated, user } = useAuth();
  const { locale } = useLocale();
  const copy = getAccountStatusCopy(locale).settings;
  const securityCopy = getAccountSecurityCopy(locale);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changePassword = trpc.auth.changePassword.useMutation({ onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); toast.success(securityCopy.reset.success); }, onError: error => toast.error(error.message || securityCopy.reset.expired) });
  const handleChangePassword = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (newPassword !== confirmPassword) { toast.error(securityCopy.reset.mismatch); return; } changePassword.mutate({ currentPassword, newPassword }); };

  return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex-1"><section className="bg-gradient-to-r from-green-50 to-emerald-50 py-12 md:py-16"><div className="container mx-auto px-4"><Link href="/mon-compte"><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-orange-500 hover:text-orange-600"><ArrowLeft className="h-5 w-5" /><span className="font-medium">{getAccountStatusCopy(locale).back}</span></div></Link><div className="mb-4 flex items-center gap-3"><Settings className="h-8 w-8 text-green-600" /><h1 className="text-4xl font-bold text-gray-800 md:text-5xl">{copy.title}</h1></div><p className="max-w-2xl text-lg text-gray-600">{copy.lead}</p></div></section><section className="py-16 md:py-24"><div className="container mx-auto max-w-2xl px-4"><Card><CardContent className="p-8"><h2 className="mb-2 text-2xl font-bold text-gray-800">{copy.profileTitle}</h2><p className="mb-6 text-gray-600">{copy.profileText}</p><div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><User className="h-5 w-5 text-slate-500" /><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{copy.name}</p><p className="font-medium text-slate-800">{user?.name || "—"}</p></div></div><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-slate-500" /><div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{copy.email}</p><p className="break-all font-medium text-slate-800">{user?.email || "—"}</p></div></div></div><Button asChild className="mt-6 w-full bg-orange-500 text-white hover:bg-orange-600"><Link href="/contact">{copy.contactCta}</Link></Button></CardContent></Card><Card className="mt-8 border-green-200 bg-green-50"><CardContent className="p-6"><h2 className="mb-2 font-semibold text-gray-800">{copy.securityTitle}</h2><p className="mb-5 text-gray-700">{copy.securityText}</p>{isAuthenticated ? <form onSubmit={handleChangePassword} className="space-y-4"><div className="space-y-2"><Label htmlFor="currentPassword">{securityCopy.password}</Label><Input id="currentPassword" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" minLength={8} required /></div><div className="space-y-2"><Label htmlFor="newPassword">{securityCopy.reset.newPassword}</Label><Input id="newPassword" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></div><div className="space-y-2"><Label htmlFor="confirmPassword">{securityCopy.reset.confirm}</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></div><Button type="submit" disabled={changePassword.isPending} className="w-full bg-orange-500 text-white hover:bg-orange-600">{changePassword.isPending ? securityCopy.reset.saving : copy.passwordCta}</Button></form> : <Button asChild className="w-full bg-orange-500 text-white hover:bg-orange-600"><Link href="/login">{copy.signInCta}</Link></Button>}<div className="mt-5 flex items-start gap-2 text-sm text-green-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{securityCopy.activate.security}</div></CardContent></Card></div></section></main><Footer /></div>;
}
