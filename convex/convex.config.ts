// Convex Configuration
import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

// Configure aggregate components for content statistics
// We use separate aggregates for each content type for better performance
app.use(aggregate, { name: "aggregateLessons" });
app.use(aggregate, { name: "aggregateUnits" });
app.use(aggregate, { name: "aggregateCategories" });
app.use(aggregate, { name: "aggregateUserProgress" });
app.use(aggregate, { name: "aggregateUnitProgress" });

// Configure action retrier for reliable external API calls
app.use(actionRetrier);

// Configure rate limiter for application-level rate limiting
app.use(rateLimiter);

export default app;
