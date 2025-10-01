// Example structure for hero data (for reference/documentation purposes)

/**
 * A single hero matchup object.
 * Example:
 * {
 *   name: "Axe",
 *   AntiMage: 0.45,
 *   CrystalMaiden: 0.52,
 *   ...
 * }
 * 
 * HeroData:
 * {
 *   Axe: [ { name: "Axe", ... }, { name: "Axe", ... } ],
 *   ...
 * }
 */

// S3 configuration for hero data
export const HERO_DATA_CONFIG = {
    bucketUrl: 'https://draftdiff.s3.amazonaws.com', // Replace with your actual S3 bucket URL
    filename: 'public/data.json.gz'
  };
  