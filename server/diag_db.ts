import mysql from "mysql2/promise";

const url = "mysql://2k8SPDCFWK7NDkW.root:hEplpFVDAZ0031VV@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/mazigho";

async function test(name: string, config: any) {
  console.log(`\n--- Test: ${name} ---`);
  try {
    const connection = await mysql.createConnection(config);
    console.log(`✅ Succès !`);
    const [rows] = await connection.execute('SELECT 1 as result');
    console.log(`Données :`, rows);
    await connection.end();
    return true;
  } catch (err: any) {
    console.error(`❌ Échec :`, err.message);
    return false;
  }
}

async function run() {
  // Test 1: URI simple
  await test("URI simple", { uri: url });

  // Test 2: URI + SSL rejectUnauthorized: true
  await test("URI + SSL strict", { uri: url, ssl: { rejectUnauthorized: true } });

  // Test 3: URI + SSL rejectUnauthorized: false
  await test("URI + SSL souple", { uri: url, ssl: { rejectUnauthorized: false } });

  // Test 4: Paramètres décomposés + SSL strict
  const parsed = new URL(url);
  await test("Décomposé + SSL strict", {
    host: parsed.hostname,
    port: parseInt(parsed.port),
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  // Test 5: Décomposé + SSL souple
  await test("Décomposé + SSL souple", {
    host: parsed.hostname,
    port: parseInt(parsed.port),
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.substring(1),
    ssl: { rejectUnauthorized: false }
  });
}

run();
