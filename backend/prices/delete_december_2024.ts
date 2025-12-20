import { api } from "encore.dev/api";
import db from "../db";

/**
 * Deletes erroneously added data for December 2024
 */
export const deleteDecember2024 = api<void, { 
  success: boolean; 
  message: string; 
  deletedRecords: number;
  citiesAffected: number;
}>(
  { expose: true, method: "DELETE", path: "/prices/delete-december-2024" },
  async () => {
    console.log("Starting deletion of December 2024 data...");

    // Date range: December 1-17, 2024
    const december2024Start = new Date("2024-12-01");
    december2024Start.setHours(0, 0, 0, 0);
    const december2024End = new Date("2024-12-17");
    december2024End.setHours(23, 59, 59, 999);

    // First check how many records will be deleted
    const recordsToDelete = await db.queryAll<{
      city_id: number;
      count: number;
    }>`
      SELECT city_id, COUNT(*) as count
      FROM price_history
      WHERE timestamp >= ${december2024Start}
        AND timestamp <= ${december2024End}
      GROUP BY city_id
    `;

    const totalRecords = recordsToDelete.reduce((sum, r) => sum + r.count, 0);
    const citiesAffected = recordsToDelete.length;

    console.log(`Found records to delete: ${totalRecords}`);
    console.log(`Cities affected: ${citiesAffected}`);

    if (totalRecords === 0) {
      return {
        success: true,
        message: "December 2024 data not found. Nothing to delete.",
        deletedRecords: 0,
        citiesAffected: 0,
      };
    }

    // Show details for each city
    if (recordsToDelete.length > 0) {
      console.log("\nCity details:");
      for (const record of recordsToDelete) {
        const city = await db.queryRow<{ name: string }>`
          SELECT name FROM cities WHERE id = ${record.city_id}
        `;
        console.log(`  - ${city?.name || `ID: ${record.city_id}`}: ${record.count} records`);
      }
    }

    // Delete records
    const result = await db.exec`
      DELETE FROM price_history
      WHERE timestamp >= ${december2024Start}
        AND timestamp <= ${december2024End}
    `;

    console.log(`\n✅ Records deleted: ${totalRecords}`);
    console.log(`✅ Cities affected: ${citiesAffected}`);

    return {
      success: true,
      message: `Successfully deleted ${totalRecords} records for December 2024 from ${citiesAffected} cities`,
      deletedRecords: totalRecords,
      citiesAffected,
    };
  }
);

