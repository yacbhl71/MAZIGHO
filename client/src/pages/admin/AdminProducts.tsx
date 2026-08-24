import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Package, Import, Loader2, Image as ImageIcon, X, ChevronDown, ChevronUp, Upload, ExternalLink, ShieldCheck, Percent, Languages, Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const automaticTranslationLocales = ["de", "it", "en", "es", "nl", "ar"] as const;

export default function AdminProducts() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [options, setOptions] = useState<{name: string, values: string[]}[]>([]);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState("");
  
  // Supplier info (Internal only)
  const [supplier, setSupplier] = useState("");
  const [supplierUrl, setSupplierUrl] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");

  // Customer-facing translations remain separate from the French source form above.
  const [translationLocale, setTranslationLocale] = useState<"de" | "it" | "en" | "es" | "nl" | "ar">("de");
  const [translationName, setTranslationName] = useState("");
  const [translationDescription, setTranslationDescription] = useState("");
  const [translationLongDescription, setTranslationLongDescription] = useState("");
  const [translationOptions, setTranslationOptions] = useState("");

  const productsQuery = trpc.admin.products.getAll.useQuery();
  const products = productsQuery.data;
  const isLoading = productsQuery.isLoading;
  const error = productsQuery.error;
  const refetch = productsQuery.refetch;
  const { data: categories } = trpc.categories.getAll.useQuery("fr");
  const translationsQuery = trpc.admin.products.getTranslations.useQuery(editingProduct?.id || 1, {
    enabled: Boolean(editingProduct?.id),
  });
  const translations = translationsQuery.data || [];
  const translationOverviewQuery = trpc.admin.products.getTranslationOverview.useQuery();
  const translationOverviewByProductId = new Map((translationOverviewQuery.data || []).map((product: any) => [product.id, product]));
  const [translatingProductId, setTranslatingProductId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
  const [translationFilter, setTranslationFilter] = useState<"all" | "ready" | "attention">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "low" | "empty">("all");

  const translationState = (productId: number) => {
    const overview = translationOverviewByProductId.get(productId) as any;
    const ready = overview?.translations?.filter((translation: any) => translation.status === "ready").length || 0;
    const stale = overview?.translations?.some((translation: any) => translation.status === "stale");
    return { ready, stale, complete: ready === 6 && !stale };
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return (products || []).filter((product: any) => {
      const translation = translationState(product.id);
      const matchesQuery = !normalizedQuery || [product.name, product.slug, product.categoryName, product.supplier]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesTranslation = translationFilter === "all" || (translationFilter === "ready" ? translation.complete : !translation.complete);
      const matchesStock = stockFilter === "all"
        || (stockFilter === "available" && product.stock > 5)
        || (stockFilter === "low" && product.stock > 0 && product.stock <= 5)
        || (stockFilter === "empty" && product.stock <= 0);
      return matchesQuery && matchesStatus && matchesTranslation && matchesStock;
    });
  }, [products, searchQuery, statusFilter, translationFilter, stockFilter, translationOverviewQuery.data]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTranslationFilter("all");
    setStockFilter("all");
  };

  const translateProduct = trpc.admin.products.translate.useMutation({
    onMutate: (input) => setTranslatingProductId(input.productId),
    onSuccess: () => {
      toast.success("Traductions générées. Vous pouvez les vérifier et les corriger ci-dessous.");
      translationsQuery.refetch();
      translationOverviewQuery.refetch();
    },
    onError: (error) => toast.error(`Traduction indisponible : ${error.message}`),
    onSettled: () => setTranslatingProductId(null),
  });

  const saveTranslation = trpc.admin.products.saveTranslation.useMutation({
    onSuccess: () => {
      toast.success("Traduction enregistrée.");
      translationsQuery.refetch();
    },
    onError: (error) => toast.error(`Impossible d’enregistrer : ${error.message}`),
  });

  const createProduct = trpc.admin.products.create.useMutation({
    onSuccess: (createdProduct) => {
      // The translation call is explicitly tied to the administrator saving the French source.
      translateProduct.mutate({ productId: createdProduct.id, locales: [...automaticTranslationLocales] });
      toast.success("Produit créé. Les versions clients sont en cours de traduction.");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: (_result, variables) => {
      // Rebuild all customer versions after a source save; the existing versions are marked stale server-side first.
      translateProduct.mutate({ productId: variables.id, locales: [...automaticTranslationLocales] });
      toast.success("Produit enregistré. Les versions clients sont en cours de mise à jour.");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const deleteProduct = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produit supprimé");
      refetch();
    },
    onError: (error) => toast.error(`Erreur : ${error.message}`),
  });

  const resetForm = () => {
    setName("");
    setSlug("");
    setPrice("");
    setOriginalPrice("");
    setDiscountPercent("");
    setStock("");
    setCategoryId("");
    setDescription("");
    setLongDescription("");
    setStatus("draft");
    setImages([]);
    setNewImageUrl("");
    setOptions([]);
    setSupplier("");
    setSupplierUrl("");
    setSupplierPrice("");
    setTranslationLocale("de");
    setTranslationName("");
    setTranslationDescription("");
    setTranslationLongDescription("");
    setTranslationOptions("");
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setSlug(product.slug);
    setPrice(String(product.price));
    setOriginalPrice(product.originalPrice ? String(product.originalPrice) : "");
    
    // Calculate initial discount percent if prices exist
    if (product.originalPrice && product.price && product.originalPrice > product.price) {
      const percent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      setDiscountPercent(String(percent));
    } else {
      setDiscountPercent("");
    }

    setStock(String(product.stock));
    setCategoryId(String(product.categoryId));
    setDescription(product.description || "");
    setLongDescription(product.longDescription || "");
    setStatus(product.status);
    setImages(product.images?.map((img: any) => img.imageUrl) || []);
    setSupplier(product.supplier || "");
    setSupplierUrl(product.supplierUrl || "");
    setSupplierPrice(product.supplierPrice ? String(product.supplierPrice) : "");
    
    try {
      const parsedOptions = typeof product.options === 'string' ? JSON.parse(product.options) : (product.options || []);
      setOptions(parsedOptions);
    } catch (e) {
      setOptions([]);
    }
    
    setIsOpen(true);
  };

  useEffect(() => {
    const current = translations.find(translation => translation.locale === translationLocale);
    setTranslationName(current?.name || "");
    setTranslationDescription(current?.description || "");
    setTranslationLongDescription(current?.longDescription || "");
    setTranslationOptions(current?.options || "");
  }, [translationLocale, translationsQuery.data]);

  // Automatic discount calculation
  useEffect(() => {
    if (originalPrice && discountPercent) {
      const orig = parseInt(originalPrice);
      const perc = parseInt(discountPercent);
      if (!isNaN(orig) && !isNaN(perc)) {
        const calculated = Math.round(orig * (1 - perc / 100));
        setPrice(String(calculated));
      }
    }
  }, [originalPrice, discountPercent]);

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const setMainImage = (index: number) => {
    if (index === 0) return;
    setImages([images[index], ...images.filter((_, i) => i !== index)]);
    toast.success("Image principale définie");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 2MB)");
      return;
    }

    toast.info("Téléversement de l'image...");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImages([...images, base64]);
      toast.success("Image ajoutée avec succès !");
    };
    reader.onerror = () => toast.error("Erreur lors de la lecture du fichier");
    reader.readAsDataURL(file);
  };

  const addOption = () => {
    if (newOptionName.trim() && newOptionValues.trim()) {
      const values = newOptionValues.split(",").map(v => v.trim()).filter(Boolean);
      setOptions([...options, { name: newOptionName.trim(), values }]);
      setNewOptionName("");
      setNewOptionValues("");
      toast.success("Option ajoutée");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedPrice = parseInt(price);
    const parsedOriginalPrice = originalPrice ? parseInt(originalPrice) : undefined;
    const parsedStock = parseInt(stock);
    const parsedCategoryId = parseInt(categoryId);
    const parsedSupplierPrice = supplierPrice ? parseInt(supplierPrice) : undefined;

    if (!name || !slug || isNaN(parsedPrice) || isNaN(parsedStock) || isNaN(parsedCategoryId)) {
      toast.error("Veuillez remplir tous les champs obligatoires avec des valeurs valides");
      return;
    }

    const payload = {
      name,
      slug,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stock: parsedStock,
      categoryId: parsedCategoryId,
      description: description || undefined,
      longDescription: longDescription || undefined,
      status: status as any,
      images: images.length > 0 ? images : undefined,
      options: options.length > 0 ? JSON.stringify(options) : undefined,
      featured: editingProduct ? undefined : 0,
      supplier: supplier || undefined,
      supplierUrl: supplierUrl || undefined,
      supplierPrice: parsedSupplierPrice,
    };

    if (editingProduct) {
      updateProduct.mutate({ 
        id: editingProduct.id, 
        ...payload
      });
    } else {
      createProduct.mutate(payload as any);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteProduct.mutate(id);
    }
  };

  const generateSlug = (val: string) => {
    setName(val);
    if (!editingProduct) {
      setSlug(val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Produits</h1>
            <p className="text-muted-foreground">Gérez votre inventaire, les prix et le statut de vos produits.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/importation">
              <Button variant="outline"><Import className="mr-2 h-4 w-4" /> Importer fournisseur</Button>
            </Link>
            
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nouveau Produit
            </Button>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-orange-600" /><h2 className="font-semibold text-slate-900">Recherche et préparation</h2></div>
              <p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Chargement du catalogue…" : `${filteredProducts.length} produit(s) affiché(s) sur ${products?.length ?? 0}`}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={!searchQuery && statusFilter === "all" && translationFilter === "all" && stockFilter === "all"} className="self-start text-slate-600 hover:bg-slate-100 lg:self-auto"><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="pl-9" placeholder="Nom, URL, catégorie ou fournisseur…" /></div>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}><SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="active">Actifs</SelectItem><SelectItem value="draft">Brouillons</SelectItem><SelectItem value="archived">Archivés</SelectItem></SelectContent></Select>
            <Select value={translationFilter} onValueChange={value => setTranslationFilter(value as typeof translationFilter)}><SelectTrigger><SelectValue placeholder="Traductions" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les traductions</SelectItem><SelectItem value="ready">6 langues prêtes</SelectItem><SelectItem value="attention">À compléter / régénérer</SelectItem></SelectContent></Select>
            <Select value={stockFilter} onValueChange={value => setStockFilter(value as typeof stockFilter)}><SelectTrigger><SelectValue placeholder="Stock" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les stocks</SelectItem><SelectItem value="available">Plus de 5 unités</SelectItem><SelectItem value="low">1 à 5 unités</SelectItem><SelectItem value="empty">Rupture de stock</SelectItem></SelectContent></Select>
          </div>
        </section>

        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Langues</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <p>Erreur lors du chargement des produits</p>
                      <p className="text-xs font-mono">{error.message}</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>Réessayer</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p>{products?.length === 0 ? "Aucun produit trouvé." : "Aucun produit ne correspond à ces filtres."}</p>
                      {products?.length === 0 ? <Button variant="outline" size="sm" onClick={() => refetch()}>Actualiser la liste</Button> : <Button variant="outline" size="sm" onClick={clearFilters}>Effacer les filtres</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{product.name}</span>
                          <span className="text-xs text-gray-500">{product.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.categoryName || "Sans catégorie"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-600">{formatPrice(product.price)}</span>
                          {product.originalPrice && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] h-4 px-1">
                              PROMO
                            </Badge>
                          )}
                        </div>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? "outline" : "destructive"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status === "active" ? "Actif" : product.status === "draft" ? "Brouillon" : "Archivé"}
                      </Badge>
                    </TableCell>
                    <TableCell>{(() => { const translation = translationState(product.id); const pending = translatingProductId === product.id; return <div className="flex flex-wrap items-center gap-1"><Badge variant="outline" className={pending ? "border-sky-200 bg-sky-50 text-sky-700" : translation.stale ? "border-amber-200 bg-amber-50 text-amber-700" : translation.complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{pending ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Traduction…</> : translation.stale ? "À régénérer" : translation.complete ? "6 / 6 prêtes" : `${translation.ready} / 6 prêtes`}</Badge></div>; })()}</TableCell>
                    <TableCell className="w-[100px]">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
              <DialogDescription>
                Remplissez les informations détaillées pour votre fiche produit professionnelle.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="mt-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="variants">Variantes</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="translations" className="bg-sky-50 text-sky-700"><Languages className="mr-1 h-3.5 w-3.5" />Traductions</TabsTrigger>
                <TabsTrigger value="internal" className="bg-orange-50 text-orange-700">Fournisseur</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input id="name" value={name} onChange={(e) => generateSlug(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="grid gap-2">
                    <Label htmlFor="originalPrice" className="text-gray-500">Prix barré (centimes)</Label>
                    <Input id="originalPrice" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="7990" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discountPercent" className="text-red-500 flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Rabais (%)
                    </Label>
                    <Input id="discountPercent" type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="20" className="border-red-200 focus:border-red-500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price" className="font-bold">Prix de vente *</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="5990" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Statut de publication</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon (invisible)</SelectItem>
                        <SelectItem value="active">Actif (en ligne)</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Accroche courte (description simple)</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Ajouter par URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://..." 
                        value={newImageUrl} 
                        onChange={(e) => setNewImageUrl(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                      />
                      <Button type="button" variant="outline" onClick={addImage}>Ajouter</Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Téléverser un fichier</Label>
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                      <Upload className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {images.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-square flex flex-col items-center justify-center p-1">
                      <img src={url} alt={`Aperçu ${index + 1}`} className="h-full w-full object-contain" />
                      <div className={`absolute bottom-0 left-0 right-0 text-white text-[10px] py-1 text-center ${index === 0 ? "bg-orange-500 font-bold" : "bg-black/60"}`}>
                        {index === 0 ? "Image principale" : `Image ${index + 1}`}
                      </div>
                      <div className="absolute right-1 top-1 flex gap-1">
                        {index !== 0 && (
                          <button type="button" onClick={() => setMainImage(index)} title="Définir comme image principale" aria-label="Définir comme image principale" className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-orange-700 shadow hover:bg-orange-50">Principale</button>
                        )}
                        <button type="button" onClick={() => removeImage(index)} title="Supprimer cette image" aria-label="Supprimer cette image" className="rounded-full bg-red-600 p-1.5 text-white shadow hover:bg-red-700">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <div className="col-span-4 py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                      <p>Aucune image ajoutée</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="variants" className="space-y-4 py-4">
                <div className="rounded-lg border p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold mb-3">Ajouter une option (ex: Taille, Couleur)</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="opt-name" className="text-xs">Nom de l'option</Label>
                      <Input id="opt-name" placeholder="Couleur" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="opt-values" className="text-xs">Valeurs (séparées par des virgules)</Label>
                      <Input id="opt-values" placeholder="Bleu, Rouge, Vert" value={newOptionValues} onChange={(e) => setNewOptionValues(e.target.value)} />
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={addOption}>
                    Ajouter cette option
                  </Button>
                </div>
                
                <div className="space-y-3 mt-4">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                      <div>
                        <span className="font-bold text-sm">{opt.name} :</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {opt.values.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{v}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {options.length === 0 && (
                    <p className="text-center py-4 text-sm text-muted-foreground italic">Aucune variante configurée.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="longDescription">Description détaillée (HTML supporté)</Label>
                  <Textarea 
                    id="longDescription" 
                    value={longDescription} 
                    onChange={(e) => setLongDescription(e.target.value)} 
                    rows={12} 
                    placeholder="Décrivez les caractéristiques techniques, les dimensions, les matériaux..."
                  />
                  <p className="text-xs text-muted-foreground">Cette description apparaîtra en bas de la fiche produit pour donner plus d'informations aux clients.</p>
                </div>
              </TabsContent>

              <TabsContent value="translations" className="space-y-4 py-4">
                {!editingProduct ? (
                  <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-4 py-8 text-center text-sm text-sky-800">Enregistrez d’abord la fiche française. Vous pourrez ensuite générer et corriger les versions destinées aux clients.</div>
                ) : (
                  <>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div><h3 className="font-semibold text-sky-950">Source française, traductions contrôlées</h3><p className="mt-1 text-xs leading-5 text-sky-800">Le produit est saisi en français. Chaque enregistrement lance automatiquement la mise à jour des versions clients ; vous pouvez toujours vérifier et corriger chaque langue ci-dessous.</p></div>
                        <Button type="button" size="sm" className="shrink-0 bg-sky-700 hover:bg-sky-800" disabled={translateProduct.isPending} onClick={() => translateProduct.mutate({ productId: editingProduct.id, locales: ["de", "it", "en", "es", "nl", "ar"] })}>{translateProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}Générer toutes les langues</Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">{(["de", "it", "en", "es", "nl", "ar"] as const).map(locale => { const translation = translations.find(item => item.locale === locale); return <button type="button" key={locale} onClick={() => setTranslationLocale(locale)} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${translation?.status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : translation?.status === "stale" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600"}`}>{locale.toUpperCase()} · {translation?.status === "ready" ? "prête" : translation?.status === "stale" ? "à régénérer" : "absente"}</button>; })}</div>
                    </div>

                    <div className="grid gap-4 rounded-lg border bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="grid gap-1"><Label htmlFor="translation-locale">Version client à éditer</Label><Select value={translationLocale} onValueChange={(value) => setTranslationLocale(value as typeof translationLocale)}><SelectTrigger id="translation-locale" className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="de">Deutsch (DE)</SelectItem><SelectItem value="it">Italiano (IT)</SelectItem><SelectItem value="en">English (EN)</SelectItem><SelectItem value="es">Español (ES)</SelectItem><SelectItem value="nl">Nederlands (NL)</SelectItem><SelectItem value="ar">العربية (AR)</SelectItem></SelectContent></Select></div><Button type="button" variant="outline" disabled={translateProduct.isPending} onClick={() => translateProduct.mutate({ productId: editingProduct.id, locales: [translationLocale] })}>{translateProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}Générer cette langue</Button></div>
                      <div className="grid gap-2"><Label htmlFor="translation-name">Nom traduit</Label><Input id="translation-name" value={translationName} onChange={event => setTranslationName(event.target.value)} /></div>
                      <div className="grid gap-2"><Label htmlFor="translation-description">Accroche traduite</Label><Textarea id="translation-description" value={translationDescription} onChange={event => setTranslationDescription(event.target.value)} rows={2} /></div>
                      <div className="grid gap-2"><Label htmlFor="translation-long-description">Description détaillée traduite</Label><Textarea id="translation-long-description" value={translationLongDescription} onChange={event => setTranslationLongDescription(event.target.value)} rows={7} /></div>
                      <details className="rounded border border-slate-200 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-slate-700">Variantes traduites (JSON, facultatif)</summary><Textarea className="mt-3 font-mono text-xs" value={translationOptions} onChange={event => setTranslationOptions(event.target.value)} rows={5} /></details>
                      <div className="flex justify-end"><Button type="button" className="bg-sky-700 hover:bg-sky-800" disabled={saveTranslation.isPending || translationName.trim().length === 0} onClick={() => saveTranslation.mutate({ productId: editingProduct.id, locale: translationLocale, name: translationName.trim(), description: translationDescription.trim() || null, longDescription: translationLongDescription.trim() || null, options: translationOptions.trim() || null })}>{saveTranslation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer cette correction</Button></div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="internal" className="space-y-4 py-4 border-2 border-orange-100 rounded-lg p-4 bg-orange-50/30">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-bold">Informations Fournisseur (INTERNE UNIQUEMENT)</h3>
                </div>
                <p className="text-xs text-orange-600 mb-4">Ces informations ne seront jamais affichées aux clients. Elles servent uniquement à votre gestion et au suivi dropshipping.</p>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Nom du fournisseur (ex: AliExpress, Temu)</Label>
                    <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="AliExpress" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplierUrl">Lien direct vers le produit (Source)</Label>
                    <div className="flex gap-2">
                      <Input id="supplierUrl" value={supplierUrl} onChange={(e) => setSupplierUrl(e.target.value)} placeholder="https://aliexpress.com/item/..." />
                      {supplierUrl && (
                        <Button type="button" variant="outline" size="icon" asChild>
                          <a href={supplierUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 w-1/2">
                    <Label htmlFor="supplierPrice">Prix d'achat fournisseur (centimes)</Label>
                    <Input id="supplierPrice" type="number" value={supplierPrice} onChange={(e) => setSupplierPrice(e.target.value)} placeholder="3400" />
                    <p className="text-[10px] text-muted-foreground">Utile pour calculer votre marge réelle.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="bg-orange-500 hover:bg-orange-600">
                {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Enregistrer les modifications" : "Créer le produit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
