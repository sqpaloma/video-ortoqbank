import { fetchQuery } from 'convex/nextjs';

import { api } from '../../../convex/_generated/api';
import { PricingClient } from './pricing-client';

// Dynamic rendering to support multi-tenant pricing
export const dynamic = 'force-dynamic';

// Default tenant slug for landing page pricing
const DEFAULT_TENANT_SLUG = 'teot';

// Helper function to fetch plans with error handling
async function getPlans() {
  try {
    // Use the public query that handles tenant resolution internally by slug
    return await fetchQuery(api.pricingPlans.getPublicPricingPlans, {
      tenantSlug: DEFAULT_TENANT_SLUG,
    });
  } catch (error) {
    console.error('Failed to fetch pricing plans:', error);
    return [];
  }
}

// Server component that fetches the data
export default async function Pricing() {
  const plans = await getPlans();
  return <PricingClient plans={plans} />;
}
