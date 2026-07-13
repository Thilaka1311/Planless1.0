import { DiscoverySection, DiscoveryItem } from "../../../core/types/discovery";
import * as queries from "./discoveryQueries";
import * as mapper from "./discoveryMapper";

/**
 * Public API endpoint for retrieval of active sections and their nested items.
 */
export async function getSectionsByCategory(category: string): Promise<DiscoverySection[]> {
  try {
    const rawSections = await queries.fetchActiveSectionsWithItems();
    if (!rawSections) return [];

    const mappedSections = rawSections.map(mapper.mapDbSectionToFrontend);

    // If "all", we return sections belonging to primary categories
    if (category.toLowerCase() === "all") {
      return mappedSections.filter(sec =>
        ["SPORTS", "MOVIES", "DINING", "DRINKS", "CUSTOM"].includes(sec.category.toUpperCase())
      );
    }

    // Otherwise, filter by specific category
    return mappedSections.filter(sec =>
      sec.category.toUpperCase() === category.toUpperCase()
    );
  } catch (err: any) {
    console.error(`[DiscoveryService] Error loading sections for category ${category}:`, err.message || err);
    return [];
  }
}

/**
 * Fetch all items for admin panel filtering by category.
 */
export async function adminFetchItems(category: string): Promise<DiscoveryItem[]> {
  try {
    const rawItems = await queries.fetchAllItems();
    const mappedItems = rawItems.map(mapper.mapDbItemToFrontend);
    return mappedItems.filter(item => item.category.toUpperCase() === category.toUpperCase());
  } catch (err: any) {
    console.error(`[DiscoveryService] Admin failed to fetch items:`, err.message || err);
    return [];
  }
}

/**
 * Admin: Create a new discovery item.
 */
export async function adminCreateItem(payload: Record<string, any>, config: any): Promise<void> {
  const record = mapper.buildDbItemPayload(payload, config);
  await queries.insertItem(record);
}

/**
 * Admin: Update an existing discovery item.
 */
export async function adminUpdateItem(id: string, payload: Record<string, any>, config: any): Promise<void> {
  const record = mapper.buildDbItemPayload(payload, config);
  await queries.updateItem(id, record);
}

/**
 * Admin: Soft-delete a discovery item.
 */
export async function adminDeleteItem(id: string): Promise<void> {
  await queries.deleteItem(id);
}
