import type { StorefrontLocale } from "@/contexts/LocaleContext";

export type ReviewFormCopy = {
  title: string;
  intro: string;
  nameLabel: string;
  namePlaceholder: string;
  ratingLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  errorName: string;
  errorRating: string;
  errorGeneric: string;
};

const copy: Record<StorefrontLocale, ReviewFormCopy> = {
  fr: {
    title: "Donnez votre avis",
    intro: "Partagez votre expérience pour aider les autres clients.",
    nameLabel: "Votre nom",
    namePlaceholder: "Ex. Sophie L.",
    ratingLabel: "Votre note",
    commentLabel: "Votre avis (facultatif)",
    commentPlaceholder: "Qu'avez-vous pensé de ce produit ?",
    submit: "Publier mon avis",
    submitting: "Publication…",
    success: "Merci ! Votre avis a été publié.",
    errorName: "Merci d'indiquer votre nom (au moins 2 caractères).",
    errorRating: "Merci de sélectionner une note.",
    errorGeneric: "Impossible de publier l'avis. Réessayez dans un instant.",
  },
  de: {
    title: "Bewertung abgeben",
    intro: "Teilen Sie Ihre Erfahrung, um anderen Kunden zu helfen.",
    nameLabel: "Ihr Name",
    namePlaceholder: "z. B. Sophie L.",
    ratingLabel: "Ihre Bewertung",
    commentLabel: "Ihre Bewertung (optional)",
    commentPlaceholder: "Wie fanden Sie dieses Produkt?",
    submit: "Bewertung veröffentlichen",
    submitting: "Wird veröffentlicht…",
    success: "Danke! Ihre Bewertung wurde veröffentlicht.",
    errorName: "Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen).",
    errorRating: "Bitte wählen Sie eine Bewertung.",
    errorGeneric: "Bewertung konnte nicht veröffentlicht werden. Bitte erneut versuchen.",
  },
  it: {
    title: "Lascia una recensione",
    intro: "Condividi la tua esperienza per aiutare gli altri clienti.",
    nameLabel: "Il tuo nome",
    namePlaceholder: "Es. Sophie L.",
    ratingLabel: "Il tuo voto",
    commentLabel: "La tua recensione (facoltativa)",
    commentPlaceholder: "Cosa ne pensi di questo prodotto?",
    submit: "Pubblica la recensione",
    submitting: "Pubblicazione…",
    success: "Grazie! La tua recensione è stata pubblicata.",
    errorName: "Inserisci il tuo nome (almeno 2 caratteri).",
    errorRating: "Seleziona un voto.",
    errorGeneric: "Impossibile pubblicare la recensione. Riprova tra poco.",
  },
  en: {
    title: "Leave a review",
    intro: "Share your experience to help other shoppers.",
    nameLabel: "Your name",
    namePlaceholder: "e.g. Sophie L.",
    ratingLabel: "Your rating",
    commentLabel: "Your review (optional)",
    commentPlaceholder: "What did you think of this product?",
    submit: "Post my review",
    submitting: "Posting…",
    success: "Thank you! Your review has been published.",
    errorName: "Please enter your name (at least 2 characters).",
    errorRating: "Please select a rating.",
    errorGeneric: "Could not publish the review. Please try again shortly.",
  },
  es: {
    title: "Deja tu opinión",
    intro: "Comparte tu experiencia para ayudar a otros clientes.",
    nameLabel: "Tu nombre",
    namePlaceholder: "Ej. Sophie L.",
    ratingLabel: "Tu valoración",
    commentLabel: "Tu opinión (opcional)",
    commentPlaceholder: "¿Qué te pareció este producto?",
    submit: "Publicar mi opinión",
    submitting: "Publicando…",
    success: "¡Gracias! Tu opinión se ha publicado.",
    errorName: "Indica tu nombre (al menos 2 caracteres).",
    errorRating: "Selecciona una valoración.",
    errorGeneric: "No se pudo publicar la opinión. Inténtalo de nuevo en un momento.",
  },
  nl: {
    title: "Laat een beoordeling achter",
    intro: "Deel uw ervaring om andere klanten te helpen.",
    nameLabel: "Uw naam",
    namePlaceholder: "Bijv. Sophie L.",
    ratingLabel: "Uw beoordeling",
    commentLabel: "Uw beoordeling (optioneel)",
    commentPlaceholder: "Wat vond u van dit product?",
    submit: "Beoordeling plaatsen",
    submitting: "Bezig met plaatsen…",
    success: "Bedankt! Uw beoordeling is geplaatst.",
    errorName: "Vul uw naam in (minstens 2 tekens).",
    errorRating: "Selecteer een beoordeling.",
    errorGeneric: "Kon de beoordeling niet plaatsen. Probeer het zo opnieuw.",
  },
  ar: {
    title: "اترك تقييمك",
    intro: "شارك تجربتك لمساعدة العملاء الآخرين.",
    nameLabel: "اسمك",
    namePlaceholder: "مثال: سمير ل.",
    ratingLabel: "تقييمك",
    commentLabel: "تقييمك (اختياري)",
    commentPlaceholder: "ما رأيك في هذا المنتج؟",
    submit: "نشر تقييمي",
    submitting: "جارٍ النشر…",
    success: "شكراً! تم نشر تقييمك.",
    errorName: "يرجى إدخال اسمك (حرفان على الأقل).",
    errorRating: "يرجى اختيار تقييم.",
    errorGeneric: "تعذّر نشر التقييم. أعد المحاولة بعد قليل.",
  },
};

export function getReviewFormCopy(locale: StorefrontLocale): ReviewFormCopy {
  return copy[locale] ?? copy.fr;
}
