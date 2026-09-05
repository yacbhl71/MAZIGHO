/**
 * MAZIGHO — Sélecteurs AliExpress centralisés.
 * ------------------------------------------------------------------
 * AliExpress change régulièrement ses classes CSS / son HTML.
 * Quand l'automatisation casse, il suffit de METTRE À JOUR CE SEUL FICHIER
 * (ou de demander à une IA de le faire) sans toucher à la logique.
 *
 * Chaque champ accepte PLUSIEURS sélecteurs séparés par une virgule :
 * le script essaiera chacun dans l'ordre jusqu'à en trouver un présent.
 * ------------------------------------------------------------------
 */
globalThis.MAZIGHO_AE_SELECTORS = {
  version: "2026-06-01",

  // Page produit
  product: {
    // Groupes d'options (couleur, taille…) et leurs valeurs cliquables
    skuPropertyGroup: '.sku-property, [class*="sku-item--property"], .product-variation',
    skuValue: '.sku-property-item, [class*="sku-item--"] .sku-property-text, .sku-property-image',
    quantityInput: 'input.quantity--input, input[class*="quantity"], input[name="quantity"]',
    addToCartBtn: 'button[class*="addcart"], .addcart, button[data-role="addToCart"], .product-action .addcart',
    buyNowBtn: 'button[class*="buynow"], .buynow, button[data-role="buyNow"], .product-action .buynow',
  },

  // Panier
  cart: {
    checkoutBtn: '.cart-checkout, button[class*="checkout"], .checkout-btn',
    itemRow: '.cart-item, [class*="cart-item"]',
  },

  // Tunnel de commande (checkout)
  checkout: {
    addNewAddressBtn: '.address-add-btn, #add-new-address-link, [class*="addAddress"], button[class*="add-address"]',
    inputContactName: 'input[name="contactPerson"], input[name="contactName"], input[id*="contactPerson"]',
    inputPhone: 'input[name="mobileNo"], input[name="phone"], input[id*="mobile"]',
    inputAddressLine1: 'input[name="address"], input[name="addressLine1"], textarea[name="address"]',
    inputAddressLine2: 'input[name="address2"], input[name="addressLine2"]',
    inputZipCode: 'input[name="zip"], input[name="zipCode"], input[name="postCode"]',
    inputCity: 'input[name="city"], input[id*="city"]',
    inputState: 'input[name="province"], input[name="state"]',
    selectCountry: 'select[name="country"], select[name="countryCode"], .country-select select',
    countryComboOpen: '.country-select, [class*="country"] [class*="select"]',
    saveAddressBtn: '.address-save, button[class*="saveAddress"], button[type="submit"][class*="save"]',
    // Livraison
    shippingOption: '.shipping-list .shipping-item, [class*="logistics"] [class*="option"]',
    shippingStandard: '[data-shipping="standard"], .shipping-item:first-child',
    // Bouton de paiement final — utilisé UNIQUEMENT pour DÉTECTER la page (jamais cliqué)
    placeOrderBtn: '.place-order-btn, button[class*="placeOrder"], button[class*="pay"]',
  },

  // Écrans de blocage / sécurité (captcha, slider, login)
  security: {
    captcha: '.nc_scale, #nc_1_wrapper, .baxia-dialog, #baxia-dialog-content, .J_MIDDLEWARE_FRAME_WIDGET',
    slider: '.nc-lang-cnt, .btn_slide, .slidetounlock',
    login: '.login-container, .batch-login, .login-dialog, #fm-login-id',
  },
};
