/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as contentStats from "../contentStats.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as modules from "../modules.js";
import type * as myFunctions from "../myFunctions.js";
import type * as progress from "../progress.js";
import type * as recentViews from "../recentViews.js";
import type * as seed from "../seed.js";
import type * as userAccess from "../userAccess.js";
import type * as userAdmin from "../userAdmin.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  contentStats: typeof contentStats;
  favorites: typeof favorites;
  http: typeof http;
  lessons: typeof lessons;
  modules: typeof modules;
  myFunctions: typeof myFunctions;
  progress: typeof progress;
  recentViews: typeof recentViews;
  seed: typeof seed;
  userAccess: typeof userAccess;
  userAdmin: typeof userAdmin;
  users: typeof users;
  videos: typeof videos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
