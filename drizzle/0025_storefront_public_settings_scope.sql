-- Sixth multi-store phase: public storefront preferences.
-- Only store-facing configuration moves from legacy global settings. Deployment
-- secrets, supplier credentials and platform-wide maintenance controls stay out.

INSERT IGNORE INTO `storeSettings` (`storeId`, `key`, `value`, `description`)
SELECT st.`id`, se.`key`, se.`value`, se.`description`
FROM `stores` st
INNER JOIN `settings` se ON se.`key` IN (
  'site_name',
  'contact_email',
  'currency',
  'store_currency_code',
  'store_currency_rate_bps',
  'shipping_policy',
  'free_shipping_threshold',
  'flat_shipping_rate',
  'meta_pixel_id',
  'tiktok_pixel_id',
  'setup_wizard_status',
  'seo_default_title',
  'seo_default_description'
)
WHERE st.`slug` = 'primary-store';

-- `storeSettings` already has the composite (`storeId`, `key`) uniqueness from
-- migration 0021. INSERT IGNORE keeps this migration safe to rerun.
-- Stripe, Odoo, CJ, TiDB and provider credentials remain environment-managed.
