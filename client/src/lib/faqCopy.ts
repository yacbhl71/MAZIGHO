import type { StorefrontLocale } from "@/contexts/LocaleContext";

export type FAQCategoryKey = "all" | "delivery" | "catalog" | "account" | "support";

type FAQItem = {
  id: string;
  category: Exclude<FAQCategoryKey, "all">;
  question: string;
  answer: string;
};

type FAQCopy = {
  back: string;
  title: string;
  lead: string;
  categoriesTitle: string;
  categories: Record<FAQCategoryKey, string>;
  empty: string;
  contactTitle: string;
  contactText: string;
  contactCta: string;
  items: FAQItem[];
};

const copy: Record<StorefrontLocale, FAQCopy> = {
  fr: {
    back: "Retour à l’accueil",
    title: "Questions fréquentes",
    lead: "Les réponses utiles pour parcourir MAZIGHO en toute clarté.",
    categoriesTitle: "Catégories",
    categories: { all: "Toutes", delivery: "Livraison", catalog: "Catalogue", account: "Compte", support: "Support" },
    empty: "Aucune question dans cette catégorie.",
    contactTitle: "Vous n’avez pas trouvé votre réponse ?",
    contactText: "Notre équipe reste disponible par le formulaire de contact pour toute question complémentaire.",
    contactCta: "Nous contacter",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "Comment la livraison est-elle confirmée ?", answer: "Avant toute préparation de commande, MAZIGHO vérifie le produit, le stock et le profil de livraison pour le pays choisi. Le coût et le délai ne sont affichés que lorsqu’ils sont validés." },
      { id: "delivery-destinations", category: "delivery", question: "À quelles destinations un produit peut-il être livré ?", answer: "La Suisse et plusieurs pays européens peuvent être sélectionnés. La disponibilité dépend toutefois du produit et de sa destination : un article sans profil validé pour votre pays ne peut pas être préparé." },
      { id: "catalog-language", category: "catalog", question: "Pourquoi un produit n’apparaît-il pas dans ma langue ?", answer: "Les fiches sont écrites en français puis vérifiées dans les autres langues. Tant qu’une traduction n’est pas prête, le produit reste volontairement masqué dans cette langue afin d’éviter un contenu incomplet." },
      { id: "catalog-price", category: "catalog", question: "Les frais et délais sont-ils les mêmes pour tous les produits ?", answer: "Non. Ils peuvent varier selon le produit et le pays de destination. MAZIGHO ne présente pas un coût de livraison comme confirmé lorsqu’aucune donnée fiable n’est disponible." },
      { id: "account-email", category: "account", question: "Que se passe-t-il si l’e-mail de compte est indisponible ?", answer: "Les pages de compte indiquent clairement l’état du service. MAZIGHO ne prétend jamais qu’un lien d’activation ou de réinitialisation a été envoyé lorsqu’il ne peut pas l’être." },
      { id: "support-contact", category: "support", question: "Comment contacter MAZIGHO ?", answer: "Utilisez le formulaire de contact. Votre demande est transmise à l’équipe MAZIGHO pour un suivi manuel." },
    ],
  },
  de: {
    back: "Zurück zur Startseite",
    title: "Häufige Fragen",
    lead: "Nützliche Antworten für einen transparenten Besuch bei MAZIGHO.",
    categoriesTitle: "Kategorien",
    categories: { all: "Alle", delivery: "Lieferung", catalog: "Katalog", account: "Konto", support: "Support" },
    empty: "In dieser Kategorie gibt es keine Frage.",
    contactTitle: "Keine passende Antwort gefunden?",
    contactText: "Unser Team ist über das Kontaktformular für weitere Fragen erreichbar.",
    contactCta: "Kontakt aufnehmen",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "Wie wird die Lieferung bestätigt?", answer: "Vor jeder Bestellvorbereitung prüft MAZIGHO Produkt, Bestand und Lieferprofil für das gewählte Land. Kosten und Lieferzeit werden nur angezeigt, wenn sie bestätigt sind." },
      { id: "delivery-destinations", category: "delivery", question: "Wohin kann ein Produkt geliefert werden?", answer: "Die Schweiz und mehrere europäische Länder können ausgewählt werden. Die Verfügbarkeit hängt jedoch vom Produkt und Ziel ab: Ohne bestätigtes Profil für Ihr Land kann ein Artikel nicht vorbereitet werden." },
      { id: "catalog-language", category: "catalog", question: "Warum erscheint ein Produkt nicht in meiner Sprache?", answer: "Produktseiten werden auf Französisch erstellt und danach in weiteren Sprachen geprüft. Solange eine Übersetzung nicht bereit ist, bleibt das Produkt in dieser Sprache bewusst verborgen." },
      { id: "catalog-price", category: "catalog", question: "Sind Kosten und Lieferzeiten für alle Produkte gleich?", answer: "Nein. Sie können je nach Produkt und Zielland variieren. MAZIGHO stellt Lieferkosten nicht als bestätigt dar, wenn keine verlässlichen Daten vorliegen." },
      { id: "account-email", category: "account", question: "Was geschieht, wenn der Konto-E-Mail-Service nicht verfügbar ist?", answer: "Die Kontoseiten zeigen den Status des Dienstes klar an. MAZIGHO behauptet niemals, dass ein Aktivierungs- oder Zurücksetzungslink gesendet wurde, wenn dies nicht möglich ist." },
      { id: "support-contact", category: "support", question: "Wie kann ich MAZIGHO kontaktieren?", answer: "Nutzen Sie das Kontaktformular. Ihre Anfrage wird für eine manuelle Bearbeitung an das MAZIGHO-Team weitergeleitet." },
    ],
  },
  it: {
    back: "Torna alla home",
    title: "Domande frequenti",
    lead: "Risposte utili per visitare MAZIGHO in modo trasparente.",
    categoriesTitle: "Categorie",
    categories: { all: "Tutte", delivery: "Consegna", catalog: "Catalogo", account: "Account", support: "Assistenza" },
    empty: "Nessuna domanda in questa categoria.",
    contactTitle: "Non hai trovato la risposta?",
    contactText: "Il nostro team è disponibile tramite il modulo di contatto per ulteriori domande.",
    contactCta: "Contattaci",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "Come viene confermata la consegna?", answer: "Prima di ogni preparazione d’ordine, MAZIGHO verifica prodotto, stock e profilo di consegna per il paese scelto. Costo e tempi sono mostrati solo quando convalidati." },
      { id: "delivery-destinations", category: "delivery", question: "Dove può essere consegnato un prodotto?", answer: "Si possono selezionare la Svizzera e vari paesi europei. La disponibilità dipende però dal prodotto e dalla destinazione: senza profilo convalidato per il tuo paese, l’articolo non può essere preparato." },
      { id: "catalog-language", category: "catalog", question: "Perché un prodotto non compare nella mia lingua?", answer: "Le schede sono redatte in francese e poi controllate nelle altre lingue. Finché una traduzione non è pronta, il prodotto resta volontariamente nascosto in quella lingua." },
      { id: "catalog-price", category: "catalog", question: "Costi e tempi sono identici per tutti i prodotti?", answer: "No. Possono variare secondo il prodotto e il paese di destinazione. MAZIGHO non presenta un costo di consegna come confermato senza dati affidabili." },
      { id: "account-email", category: "account", question: "Cosa succede se il servizio e-mail dell’account non è disponibile?", answer: "Le pagine account indicano chiaramente lo stato del servizio. MAZIGHO non afferma mai che un link di attivazione o reimpostazione sia stato inviato quando non è possibile." },
      { id: "support-contact", category: "support", question: "Come posso contattare MAZIGHO?", answer: "Usa il modulo di contatto. La richiesta viene trasmessa al team MAZIGHO per un seguito manuale." },
    ],
  },
  en: {
    back: "Back to home",
    title: "Frequently asked questions",
    lead: "Useful answers for a clear visit to MAZIGHO.",
    categoriesTitle: "Categories",
    categories: { all: "All", delivery: "Delivery", catalog: "Catalogue", account: "Account", support: "Support" },
    empty: "No question in this category.",
    contactTitle: "Didn’t find your answer?",
    contactText: "Our team remains available through the contact form for any further question.",
    contactCta: "Contact us",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "How is delivery confirmed?", answer: "Before any order preparation, MAZIGHO checks the product, stock and delivery profile for the selected country. Cost and timing are shown only when validated." },
      { id: "delivery-destinations", category: "delivery", question: "Where can a product be delivered?", answer: "Switzerland and several European countries can be selected. Availability still depends on the product and destination: an item without a validated profile for your country cannot be prepared." },
      { id: "catalog-language", category: "catalog", question: "Why is a product not shown in my language?", answer: "Product pages are written in French and then checked in the other languages. Until a translation is ready, the product is deliberately hidden in that language to avoid incomplete content." },
      { id: "catalog-price", category: "catalog", question: "Are delivery costs and times identical for every product?", answer: "No. They may vary by product and destination country. MAZIGHO does not present a delivery cost as confirmed when reliable data is unavailable." },
      { id: "account-email", category: "account", question: "What happens if the account email service is unavailable?", answer: "Account pages clearly show the service status. MAZIGHO never claims that an activation or reset link was sent when it could not be sent." },
      { id: "support-contact", category: "support", question: "How can I contact MAZIGHO?", answer: "Use the contact form. Your request is passed to the MAZIGHO team for manual follow-up." },
    ],
  },
  es: {
    back: "Volver al inicio",
    title: "Preguntas frecuentes",
    lead: "Respuestas útiles para visitar MAZIGHO con claridad.",
    categoriesTitle: "Categorías",
    categories: { all: "Todas", delivery: "Entrega", catalog: "Catálogo", account: "Cuenta", support: "Soporte" },
    empty: "No hay preguntas en esta categoría.",
    contactTitle: "¿No has encontrado tu respuesta?",
    contactText: "Nuestro equipo está disponible mediante el formulario de contacto para cualquier consulta adicional.",
    contactCta: "Contactarnos",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "¿Cómo se confirma la entrega?", answer: "Antes de preparar un pedido, MAZIGHO comprueba el producto, el stock y el perfil de entrega para el país elegido. El coste y el plazo se muestran solo cuando están validados." },
      { id: "delivery-destinations", category: "delivery", question: "¿A dónde se puede entregar un producto?", answer: "Se pueden seleccionar Suiza y varios países europeos. Sin embargo, la disponibilidad depende del producto y del destino: un artículo sin perfil validado para tu país no puede prepararse." },
      { id: "catalog-language", category: "catalog", question: "¿Por qué no aparece un producto en mi idioma?", answer: "Las fichas se redactan en francés y después se revisan en los demás idiomas. Hasta que una traducción esté lista, el producto queda oculto deliberadamente en ese idioma." },
      { id: "catalog-price", category: "catalog", question: "¿Son iguales los costes y plazos para todos los productos?", answer: "No. Pueden variar según el producto y el país de destino. MAZIGHO no presenta un coste de entrega como confirmado cuando no hay datos fiables." },
      { id: "account-email", category: "account", question: "¿Qué ocurre si el servicio de correo de la cuenta no está disponible?", answer: "Las páginas de cuenta muestran claramente el estado del servicio. MAZIGHO nunca afirma que se envió un enlace de activación o restablecimiento cuando no ha podido enviarse." },
      { id: "support-contact", category: "support", question: "¿Cómo puedo contactar con MAZIGHO?", answer: "Utiliza el formulario de contacto. Tu solicitud se transmite al equipo de MAZIGHO para un seguimiento manual." },
    ],
  },
  nl: {
    back: "Terug naar home",
    title: "Veelgestelde vragen",
    lead: "Nuttige antwoorden voor een duidelijk bezoek aan MAZIGHO.",
    categoriesTitle: "Categorieën",
    categories: { all: "Alle", delivery: "Levering", catalog: "Catalogus", account: "Account", support: "Ondersteuning" },
    empty: "Geen vraag in deze categorie.",
    contactTitle: "Geen antwoord gevonden?",
    contactText: "Ons team blijft bereikbaar via het contactformulier voor bijkomende vragen.",
    contactCta: "Contact opnemen",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "Hoe wordt levering bevestigd?", answer: "Vóór een bestelling wordt voorbereid, controleert MAZIGHO het product, de voorraad en het leveringsprofiel voor het gekozen land. Kosten en termijn worden alleen getoond wanneer ze bevestigd zijn." },
      { id: "delivery-destinations", category: "delivery", question: "Waar kan een product worden geleverd?", answer: "Zwitserland en verschillende Europese landen kunnen worden gekozen. Beschikbaarheid hangt echter af van product en bestemming: zonder gevalideerd profiel voor uw land kan een artikel niet worden voorbereid." },
      { id: "catalog-language", category: "catalog", question: "Waarom wordt een product niet in mijn taal getoond?", answer: "Productpagina’s worden in het Frans opgesteld en daarna in de andere talen gecontroleerd. Tot een vertaling klaar is, blijft het product bewust verborgen in die taal." },
      { id: "catalog-price", category: "catalog", question: "Zijn kosten en levertijden voor alle producten gelijk?", answer: "Nee. Ze kunnen verschillen per product en bestemmingsland. MAZIGHO presenteert leveringskosten niet als bevestigd wanneer betrouwbare gegevens ontbreken." },
      { id: "account-email", category: "account", question: "Wat gebeurt er als de e-mailservice voor accounts niet beschikbaar is?", answer: "De accountpagina’s tonen de status van de dienst duidelijk. MAZIGHO beweert nooit dat een activerings- of resetlink is verstuurd wanneer dat niet mogelijk was." },
      { id: "support-contact", category: "support", question: "Hoe neem ik contact op met MAZIGHO?", answer: "Gebruik het contactformulier. Uw vraag wordt aan het MAZIGHO-team doorgegeven voor manuele opvolging." },
    ],
  },
  ar: {
    back: "العودة إلى الرئيسية",
    title: "الأسئلة الشائعة",
    lead: "إجابات مفيدة لزيارة MAZIGHO بوضوح.",
    categoriesTitle: "الفئات",
    categories: { all: "الكل", delivery: "التوصيل", catalog: "الكتالوج", account: "الحساب", support: "الدعم" },
    empty: "لا توجد أسئلة في هذه الفئة.",
    contactTitle: "لم تجد الإجابة؟",
    contactText: "يبقى فريقنا متاحاً عبر نموذج الاتصال لأي استفسار إضافي.",
    contactCta: "اتصل بنا",
    items: [
      { id: "delivery-confirmation", category: "delivery", question: "كيف يتم تأكيد التوصيل؟", answer: "قبل أي تحضير للطلب، تتحقق MAZIGHO من المنتج والمخزون وملف التوصيل للبلد المختار. لا تُعرض التكلفة والمدة إلا بعد تأكيدهما." },
      { id: "delivery-destinations", category: "delivery", question: "إلى أين يمكن توصيل المنتج؟", answer: "يمكن اختيار سويسرا وعدة بلدان أوروبية. إلا أن التوفر يعتمد على المنتج والوجهة: لا يمكن تحضير منتج لا يملك ملفاً مؤكداً لبلدك." },
      { id: "catalog-language", category: "catalog", question: "لماذا لا يظهر المنتج بلغتي؟", answer: "تُكتب صفحات المنتجات بالفرنسية ثم تُراجع باللغات الأخرى. إلى أن تصبح الترجمة جاهزة، يُخفى المنتج عمداً في تلك اللغة لتجنب محتوى غير مكتمل." },
      { id: "catalog-price", category: "catalog", question: "هل تكاليف ومدة التوصيل متطابقة لجميع المنتجات؟", answer: "لا. قد تختلف بحسب المنتج وبلد الوجهة. لا تعرض MAZIGHO تكلفة التوصيل على أنها مؤكدة عندما لا تتوفر بيانات موثوقة." },
      { id: "account-email", category: "account", question: "ماذا يحدث عند تعذر خدمة البريد الإلكتروني للحساب؟", answer: "توضح صفحات الحساب حالة الخدمة بوضوح. لا تدّعي MAZIGHO أبداً إرسال رابط تفعيل أو إعادة تعيين عندما يتعذر إرساله." },
      { id: "support-contact", category: "support", question: "كيف أتواصل مع MAZIGHO؟", answer: "استخدم نموذج الاتصال. يُحوّل طلبك إلى فريق MAZIGHO للمتابعة اليدوية." },
    ],
  },
};

export function getFAQCopy(locale: StorefrontLocale): FAQCopy {
  return copy[locale] ?? copy.fr;
}
