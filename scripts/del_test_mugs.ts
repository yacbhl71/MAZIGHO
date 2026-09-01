import "dotenv/config";
import * as db from "../server/db";
(async () => {
  for (const id of [240001,240002,240003]) { await db.deleteProduct(id); console.log("deleted", id); }
  process.exit(0);
})();
