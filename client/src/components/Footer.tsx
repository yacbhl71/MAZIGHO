import { Facebook, Instagram, Linkedin, Mail, Music2, PinIcon, Youtube } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";
import { t } from "@/lib/i18n";
import { getPublicCopy } from "@/lib/publicCopy";
import { getLocalizedCategoryPresentation } from "@/lib/categoryPresentation";
import { trpc } from "@/lib/trpc";
import { useDesignProfile, type FooterSocialLink } from "@/hooks/useDesignProfile";

const socialMeta: Record<FooterSocialLink["id"], { label: string; icon: typeof Instagram }> = {
  instagram: { label: "Instagram", icon: Instagram },
  facebook: { label: "Facebook", icon: Facebook },
  tiktok: { label: "TikTok", icon: Music2 },
  youtube: { label: "YouTube", icon: Youtube },
  pinterest: { label: "Pinterest", icon: PinIcon },
  linkedin: { label: "LinkedIn", icon: Linkedin },
};

function StorefrontFooterLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (/^https:\/\//i.test(href)) return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  return <Link href={href || "/"}><span className={className}>{children}</span></Link>;
}

export default function Footer() {
  const { locale } = useLocale();
  const copy = getPublicCopy(locale);
  const { profile, palette, isLoading: designProfileLoading } = useDesignProfile(locale);
  const storeAvailability = trpc.storefront.getAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const categoriesQuery = trpc.categories.getAll.useQuery(locale);
  const categories = (categoriesQuery.data || [])
    .map(category => getLocalizedCategoryPresentation(locale, category))
    .filter(category => category.catalogSection !== "creations")
    .slice(0, 5);
  const visibleNavigation = (profile.navigationItems || []).filter(item => item.visible).slice(0, 7);
  const fallbackNavigationLabels: Record<string, string> = {
    home: t(locale, "home"),
    shop: t(locale, "shop"),
    categories: t(locale, "categories"),
    creations: t(locale, "creations"),
    new: t(locale, "new"),
    "best-sellers": t(locale, "bestSellers"),
    promos: t(locale, "promotions"),
    contact: t(locale, "contact"),
  };
  const socialLinks = (profile.footerSocialLinks || []).filter(link => link.url);
  const brandName = profile.brandName?.trim() || "Boutique";
  const linkClass = "cursor-pointer text-sm text-white/80 transition-colors hover:text-white";

  if (designProfileLoading || storeAvailability.isLoading) {
    return <footer className="mt-20 bg-slate-900" aria-busy="true" aria-label="Chargement du pied de page"><div className="container mx-auto h-52 animate-pulse px-4 py-12"><div className="h-5 w-40 rounded bg-white/15" /><div className="mt-6 grid gap-6 md:grid-cols-4"><div className="h-16 rounded bg-white/10" /><div className="h-16 rounded bg-white/10" /><div className="h-16 rounded bg-white/10" /><div className="h-16 rounded bg-white/10" /></div></div></footer>;
  }

  return (
    <footer className="mt-20 text-white" style={{ backgroundColor: palette.primary }}>
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 gap-8 ${[profile.footerShowNavigation && visibleNavigation.length > 0, profile.footerShowCategories && categories.length > 0, profile.footerShowHelp].filter(Boolean).length >= 3 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="space-y-4">
            <StorefrontFooterLink href="/" className="inline-flex items-center gap-3">
              {profile.brandLogoUrl ? <img src={profile.brandLogoUrl} alt="" className="h-10 w-10 rounded-lg border border-white/20 bg-white object-contain p-0.5" /> : null}
              <span className="text-xl font-semibold tracking-[0.11em] text-white">{brandName}</span>
            </StorefrontFooterLink>
            {profile.footerDescription ? <p className="max-w-xs text-sm leading-6 text-white/80">{profile.footerDescription}</p> : null}
            {socialLinks.length > 0 ? <div className="flex flex-wrap gap-2 pt-1">{socialLinks.map(link => {
              const meta = socialMeta[link.id];
              const Icon = meta.icon;
              return <a key={link.id} href={link.url} target="_blank" rel="noreferrer" aria-label={meta.label} title={meta.label} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"><Icon className="h-4 w-4" /></a>;
            })}</div> : null}
          </div>

          {profile.footerShowNavigation && visibleNavigation.length > 0 ? <div>
            <h3 className="mb-4 text-lg font-semibold text-white">{profile.footerNavigationTitle}</h3>
            <ul className="space-y-2">{visibleNavigation.map(item => <li key={item.id}><StorefrontFooterLink href={item.href} className={linkClass}>{item.label?.trim() || fallbackNavigationLabels[item.id] || "Menu"}</StorefrontFooterLink></li>)}</ul>
          </div> : null}

          {profile.footerShowCategories && categories.length > 0 ? <div>
            <h3 className="mb-4 text-lg font-semibold text-white">{profile.footerCategoriesTitle}</h3>
            <ul className="space-y-2">{categories.map(category => <li key={category.id}><StorefrontFooterLink href={`/categorie/${category.slug}`} className={linkClass}>{category.name}</StorefrontFooterLink></li>)}</ul>
          </div> : null}

          {profile.footerShowHelp ? <div>
            <h3 className="mb-4 text-lg font-semibold text-white">{profile.footerHelpTitle}</h3>
            <ul className="space-y-3">
              <li><StorefrontFooterLink href="/faq" className={linkClass}>{t(locale, "faq")}</StorefrontFooterLink></li>
              {profile.footerContactText ? <li><StorefrontFooterLink href={profile.footerContactUrl} className={`flex items-start gap-2 ${linkClass}`}><Mail className="mt-0.5 h-4 w-4 shrink-0 text-white" />{profile.footerContactText}</StorefrontFooterLink></li> : null}
            </ul>
          </div> : null}
        </div>

        {profile.footerShowReassurance ? <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/20 pt-8 md:grid-cols-3">
          <div className="text-center md:text-left"><h4 className="mb-2 text-sm font-semibold text-white">{profile.footerDeliveryTitle}</h4><p className="text-xs leading-5 text-white/80">{profile.footerDeliveryText}</p></div>
          <div className="text-center"><h4 className="mb-2 text-sm font-semibold text-white">{profile.footerSecureTitle}</h4><p className="text-xs leading-5 text-white/80">{profile.footerSecureText}</p></div>
          <div className="text-center md:text-right"><h4 className="mb-2 text-sm font-semibold text-white">{profile.footerServiceTitle}</h4><p className="text-xs leading-5 text-white/80">{profile.footerServiceText}</p></div>
        </div> : null}

        <div className="mt-8 border-t border-white/20 pt-6 text-center">
          <p className="mb-2 text-sm text-white/80">© {new Date().getFullYear()} {brandName}. {profile.footerCopyrightText}</p>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-white/75">
            <StorefrontFooterLink href="/conditions-generales" className="cursor-pointer hover:text-white">{copy.footer.terms}</StorefrontFooterLink><span aria-hidden="true">•</span>
            <StorefrontFooterLink href="/livraison-retours" className="cursor-pointer hover:text-white">{copy.footer.returns}</StorefrontFooterLink><span aria-hidden="true">•</span>
            <StorefrontFooterLink href="/confidentialite" className="cursor-pointer hover:text-white">{copy.footer.privacy}</StorefrontFooterLink><span aria-hidden="true">•</span>
            <StorefrontFooterLink href="/mentions-legales" className="cursor-pointer hover:text-white">{copy.footer.legal}</StorefrontFooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
