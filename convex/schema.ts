import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    role: v.union(v.literal("user"), v.literal("admin")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    hasActiveYearAccess: v.boolean(),
    paid: v.boolean(),
    paymentDate: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    testeId: v.optional(v.string()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_hasActiveYearAccess", ["hasActiveYearAccess"]),

  // Categories table
  categories: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    position: v.number(),
    iconUrl: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_position", ["position"]),

  // Modules table (formerly courses)
  modules: defineTable({
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    order_index: v.number(),
    totalLessonVideos: v.number(),
  })
    .index("by_categoryId", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_categoryId_and_order", ["categoryId", "order_index"]),

  // Lessons table (video lessons)
  lessons: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    bunnyStoragePath: v.optional(v.string()),
    publicUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    durationSeconds: v.number(),
    order_index: v.number(),
    lessonNumber: v.number(),
    isPublished: v.boolean(),
    tags: v.optional(v.array(v.string())),
    videoId: v.optional(v.string()), // Bunny video ID
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_slug", ["slug"])
    .index("by_moduleId_and_order", ["moduleId", "order_index"])
    .index("by_isPublished", ["isPublished"])
    .index("by_videoId", ["videoId"]),

  // Videos table (Bunny Stream videos)
  videos: defineTable({
    videoId: v.string(), // Bunny library video id
    libraryId: v.string(), // Bunny library id
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    hlsUrl: v.optional(v.string()),
    mp4Urls: v.optional(v.array(v.object({ quality: v.string(), url: v.string() }))),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed")
    ),
    createdBy: v.string(), // userId do Clerk
    isPrivate: v.boolean(),
    metadata: v.optional(v.any()),
  })
    .index("by_videoId", ["videoId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"]),

  // User progress per lesson (granular tracking)
  userProgress: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    completed: v.boolean(),
    completedAt: v.optional(v.number()), // timestamp when completed
    currentTimeSec: v.optional(v.number()), // current playback position in seconds
    durationSec: v.optional(v.number()), // video duration in seconds
    updatedAt: v.optional(v.number()), // last update timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_userId_and_moduleId", ["userId", "moduleId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_completed", ["userId", "completed"]),

  // Aggregated progress per module (for quick module progress queries)
  moduleProgress: defineTable({
    userId: v.string(), // clerkUserId
    moduleId: v.id("modules"),
    completedLessonsCount: v.number(),
    totalLessonVideos: v.number(), // cached from module
    progressPercent: v.number(), // 0-100
    updatedAt: v.number(), // timestamp of last update
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_moduleId", ["userId", "moduleId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_userId_and_progressPercent", ["userId", "progressPercent"]),

  // Global user progress (for dashboard/home quick view)
  userGlobalProgress: defineTable({
    userId: v.string(), // clerkUserId
    completedLessonsCount: v.number(),
    progressPercent: v.number(), // 0-100
    updatedAt: v.number(), // timestamp of last update
  })
    .index("by_userId", ["userId"])
    .index("by_progressPercent", ["progressPercent"]),

  // Favorites (user's favorite lessons)
  favorites: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_lessonId", ["lessonId"]),

  // Recent views (user's recent lesson views)
  recentViews: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    viewedAt: v.number(), // timestamp
    action: v.union(v.literal("started"), v.literal("resumed"), v.literal("completed")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_viewedAt", ["userId", "viewedAt"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // Content statistics (global system stats)
  contentStats: defineTable({
    totalLessons: v.number(), // total published lessons
    totalModules: v.number(), // total modules
    totalCategories: v.number(), // total categories
    updatedAt: v.number(), // timestamp of last update
  }),

  // Lesson feedback (user feedback/questions about lessons)
  lessonFeedback: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    feedback: v.string(), // user's feedback or question
    createdAt: v.number(), // timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // Lesson ratings (user star ratings for lessons)
  lessonRatings: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    moduleId: v.id("modules"),
    rating: v.number(), // 1-5 stars
    createdAt: v.number(), // timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),
});
