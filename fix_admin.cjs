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

const email = "[ancienne-adresse-supprimee]";

connection.query("SELECT id, email, role FROM users WHERE email = ?", [email], (err, results) => {
  if (err) {
    console.error("Error querying user:", err);
    process.exit(1);
  }
  
  if (results.length === 0) {
    console.log(`User ${email} not found in database. Please log in first on the site.`);
    connection.end();
    return;
  }

  const user = results[0];
  console.log(`Found user: ${JSON.stringify(user)}`);

  if (user.role === "admin") {
    console.log("User is already admin in database.");
    connection.end();
  } else {
    console.log("Updating user to admin role...");
    connection.query("UPDATE users SET role = 'admin' WHERE id = ?", [user.id], (err2) => {
      if (err2) {
        console.error("Error updating role:", err2);
        process.exit(1);
      }
      console.log("User role successfully updated to admin!");
      connection.end();
    });
  }
});
