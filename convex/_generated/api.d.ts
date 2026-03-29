/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminPanel from "../adminPanel.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as imagekit from "../imagekit.js";
import type * as lib from "../lib.js";
import type * as notifications from "../notifications.js";
import type * as papers from "../papers.js";
import type * as uploadAuthLogs from "../uploadAuthLogs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminPanel: typeof adminPanel;
  auth: typeof auth;
  comments: typeof comments;
  http: typeof http;
  imagekit: typeof imagekit;
  lib: typeof lib;
  notifications: typeof notifications;
  papers: typeof papers;
  uploadAuthLogs: typeof uploadAuthLogs;
  users: typeof users;
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
