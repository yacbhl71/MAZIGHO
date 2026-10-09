import "dotenv/config";
import { ensureVercelManagedStoreDomain } from "../server/services/vercelManagedStoreDomain.ts";

const domain = process.argv[2];
if (!domain) {
  console.error("Usage: npm run domain:ensure -- <sous-domaine.mazigho.ch>");
  process.exit(2);
}

const result = await ensureVercelManagedStoreDomain(domain);
console.log(JSON.stringify(result, null, 2));

if (result.status === "ready" || result.status === "pending") process.exit(0);
if (result.status === "not_configured") process.exit(2);
process.exit(1);
