/**
 * CLI entrypoint for a scheme catalogue refresh. All logic lives in lib/catalog/catalog.service.ts.
 * Verbose by default (logs each category and snapshot-fetch chunk as it runs); pass --quiet
 * to suppress progress output and only print the final summary.
 */
import { catalogService } from "../lib/catalog/catalog.service.ts";
import { getMongoClient } from "../lib/providers/mongo.ts";

async function main() {
  const quiet = process.argv.includes("--quiet");
  const summary = await catalogService.refresh(
    quiet ? {} : { log: (message) => console.log(message) },
  );
  console.table(
    Object.entries(summary.byCategory).map(([category, eligibleSchemes]) => ({
      category,
      eligibleSchemes,
    })),
  );
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // The service reuses the shared Mongo client rather than closing it (a server-side caller
    // must not have its connection killed out from under it) - this CLI process is the one place
    // that actually needs to close it, so the process can exit instead of hanging on an open socket.
    const client = await getMongoClient();
    await client.close();
  });
