const mysql = require("mysql2");
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const connection = mysql.createConnection({
  uri: url,
  ssl: {
    rejectUnauthorized: true
  }
});

connection.query("SELECT * FROM categories", (err, results) => {
  if (err) {
    console.error("Error querying categories:", err);
    process.exit(1);
  }
  console.log("CATEGORIES_START");
  console.log(JSON.stringify(results));
  console.log("CATEGORIES_END");
  connection.end();
});
