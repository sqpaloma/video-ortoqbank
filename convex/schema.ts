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
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    hasActiveYearAccess: v.boolean(),
    paid: v.boolean(),
    paymentDate: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
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
    isPublished: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_position", ["position"])
    .index("by_isPublished", ["isPublished"])
    .index("by_isPublished_and_position", ["isPublished", "position"]),

  // Units table (formerly modules/courses)
  units: defineTable({
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    order_index: v.number(),
    totalLessonVideos: v.number(),
    lessonCounter: v.optional(v.number()), // Atomic counter for lesson order_index allocation
    isPublished: v.boolean(),
  })
    .index("by_categoryId", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_categoryId_and_order", ["categoryId", "order_index"])
    .index("by_isPublished", ["isPublished"])
    .index("by_categoryId_and_isPublished", ["categoryId", "isPublished"]),

  // Lessons table (video lessons)
  lessons: defineTable({
    unitId: v.id("units"),
    categoryId: v.id("categories"), // Denormalized for efficient querying
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
    .index("by_unitId", ["unitId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_unitId_and_order", ["unitId", "order_index"])
    .index("by_categoryId_and_order", ["categoryId", "order_index"])
    .index("by_isPublished", ["isPublished"])
    .index("by_videoId", ["videoId"])
    .index("by_unitId_isPublished_order", [
      "unitId",
      "isPublished",
      "order_index",
    ]),

  // Videos table (Bunny Stream videos)
  videos: defineTable({
    videoId: v.string(), // Bunny library video id
    libraryId: v.string(), // Bunny library id
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    hlsUrl: v.optional(v.string()),
    mp4Urls: v.optional(
      v.array(v.object({ quality: v.string(), url: v.string() })),
    ),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    createdBy: v.string(), // userId do Clerk
    isPrivate: v.boolean(),
    metadata: v.optional(
      v.object({
        duration: v.optional(v.number()), // Video duration in seconds
        width: v.optional(v.number()), // Video width in pixels
        height: v.optional(v.number()), // Video height in pixels
        framerate: v.optional(v.number()), // Video framerate (fps)
        bitrate: v.optional(v.number()), // Video bitrate
        extras: v.optional(v.record(v.string(), v.any())), // Additional dynamic fields
      }),
    ),
  })
    .index("by_videoId", ["videoId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"]),

  // User progress per lesson (granular tracking)
  userProgress: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    completed: v.boolean(),
    completedAt: v.optional(v.number()), // timestamp when completed
    currentTimeSec: v.optional(v.number()), // current playback position in seconds
    durationSec: v.optional(v.number()), // video duration in seconds
    updatedAt: v.optional(v.number()), // last update timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_userId_and_unitId", ["userId", "unitId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_completed", ["userId", "completed"]),

  // Aggregated progress per unit (for quick unit progress queries)
  unitProgress: defineTable({
    userId: v.string(), // clerkUserId
    unitId: v.id("units"),
    completedLessonsCount: v.number(),
    totalLessonVideos: v.number(), // cached from unit
    progressPercent: v.number(), // 0-100
    updatedAt: v.number(), // timestamp of last update
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_unitId", ["userId", "unitId"])
    .index("by_unitId", ["unitId"])
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
    unitId: v.id("units"),
    viewedAt: v.number(), // timestamp
    action: v.union(
      v.literal("started"),
      v.literal("resumed"),
      v.literal("completed"),
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_viewedAt", ["userId", "viewedAt"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // Content statistics moved to Aggregate component
  // See convex/aggregate.ts for the new implementation using @convex-dev/aggregate

  // Category position counter (atomic counter for category positions)
  categoryPositionCounter: defineTable({
    counterId: v.string(), // unique identifier to enforce single-counter document
    nextPosition: v.number(), // next available position for categories
  }).index("by_counterId", ["counterId"]),

  // Lesson feedback (user feedback/questions about lessons)
  lessonFeedback: defineTable({
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
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
    unitId: v.id("units"),
    rating: v.number(), // 1-5 stars
    createdAt: v.number(), // timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"]),
  // Admin-managed coupons for checkout
  coupons: defineTable({
    code: v.string(), // store uppercase
    type: v.union(
      v.literal("percentage"),
      v.literal("fixed"),
      v.literal("fixed_price"),
    ),
    value: v.number(),
    description: v.string(),
    active: v.boolean(),
    validFrom: v.optional(v.number()), // epoch ms
    validUntil: v.optional(v.number()), // epoch ms
    // Usage limits
    currentUses: v.optional(v.number()), // Current total usage count
    maxUses: v.optional(v.number()), // Maximum total uses allowed
  }).index("by_code", ["code"]),

  // Coupon usage tracking
  couponUsage: defineTable({
    couponId: v.id("coupons"),
    couponCode: v.string(),
    orderId: v.id("pendingOrders"),
    userEmail: v.string(),
    userCpf: v.string(),
    discountAmount: v.number(),
    originalPrice: v.number(),
    finalPrice: v.number(),
    usedAt: v.number(),
  })
    .index("by_coupon", ["couponId"])
    .index("by_coupon_user", ["couponCode", "userCpf"])
    .index("by_email", ["userEmail"])
    .index("by_cpf", ["userCpf"]),

  //pricing plans
  pricingPlans: defineTable({
    name: v.string(),
    badge: v.string(),
    originalPrice: v.optional(v.string()), // Marketing strikethrough price
    price: v.string(),
    installments: v.string(),
    installmentDetails: v.string(),
    description: v.string(),
    features: v.array(v.string()),
    buttonText: v.string(),
    // Extended fields for product identification and access control
    productId: v.string(), // e.g., "ortoqbank_2025", "ortoqbank_2026", "premium_pack" - REQUIRED
    category: v.optional(
      v.union(
        v.literal("year_access"),
        v.literal("premium_pack"),
        v.literal("addon"),
      ),
    ),
    year: v.optional(v.number()), // 2025, 2026, 2027, etc. - kept for productId naming/identification
    // Pricing (converted to numbers for calculations)
    regularPriceNum: v.optional(v.number()),
    pixPriceNum: v.optional(v.number()),
    // Access control - year-based
    accessYears: v.optional(v.array(v.number())), // Array of years user gets access to (e.g., [2026, 2027])
    isActive: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
  })
    .index("by_product_id", ["productId"])
    .index("by_category", ["category"])
    .index("by_year", ["year"])
    .index("by_active", ["isActive"]),
  // Waitlist - tracks users interested in OrtoClub TEOT
  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    whatsapp: v.string(),
    instagram: v.optional(v.string()),
    residencyLevel: v.union(
      v.literal("R1"),
      v.literal("R2"),
      v.literal("R3"),
      v.literal("Já concluí"),
    ),
    subspecialty: v.union(
      v.literal("Pediátrica"),
      v.literal("Tumor"),
      v.literal("Quadril"),
      v.literal("Joelho"),
      v.literal("Ombro e Cotovelo"),
      v.literal("Mão"),
      v.literal("Coluna"),
      v.literal("Pé e Tornozelo"),
    ),
  }).index("by_email", ["email"]),

  // Pending orders - tracks checkout sessions and payment lifecycle
  pendingOrders: defineTable({
    // Contact info (from checkout)
    email: v.string(), // Contact email from checkout
    cpf: v.string(),
    name: v.string(),
    productId: v.string(), // Product identifier (e.g., "ortoqbank_2025")

    // Address info (required for invoice generation - optional for migration)
    phone: v.optional(v.string()),
    mobilePhone: v.optional(v.string()),
    postalCode: v.optional(v.string()), // CEP
    address: v.optional(v.string()), // Street address
    addressNumber: v.optional(v.string()), // Address number (defaults to "SN" if not provided)

    // Account info (from Clerk after signup)
    userId: v.optional(v.string()), // Clerk user ID (set when claimed)
    accountEmail: v.optional(v.string()), // Account email from Clerk (may differ from contact email)

    // Payment info
    paymentMethod: v.string(), // 'PIX' or 'CREDIT_CARD'
    installmentCount: v.optional(v.number()), // Number of credit card installments (only for CREDIT_CARD)
    asaasPaymentId: v.optional(v.string()), // AsaaS payment ID
    externalReference: v.optional(v.string()), // Order ID for external reference
    originalPrice: v.number(),
    finalPrice: v.number(),

    // PIX payment data (for displaying QR code)
    pixData: v.optional(
      v.object({
        qrPayload: v.optional(v.string()), // PIX copy-paste code
        qrCodeBase64: v.optional(v.string()), // QR code image as base64
        expirationDate: v.optional(v.string()), // When the PIX QR code expires
      }),
    ),

    // Coupon info
    couponCode: v.optional(v.string()), // Coupon code used (if any)
    couponDiscount: v.optional(v.number()), // Discount amount from coupon
    pixDiscount: v.optional(v.number()), // Additional PIX discount

    // State management
    status: v.union(
      v.literal("pending"), // Order created, waiting for payment
      v.literal("paid"), // Payment confirmed
      v.literal("provisioned"), // Access granted
      v.literal("completed"), // Fully processed
      v.literal("failed"), // Payment failed or expired
    ),

    // Timestamps
    createdAt: v.number(), // When order was created
    paidAt: v.optional(v.number()), // When payment was confirmed
    provisionedAt: v.optional(v.number()), // When access was granted
    expiresAt: v.number(), // When this order expires (7 days)
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_asaas_payment", ["asaasPaymentId"])
    .index("by_external_reference", ["externalReference"]),

  // Invoices - tracks nota fiscal (invoice) generation for paid orders
  // IMPORTANT: For installment payments, ONE invoice is generated with the TOTAL value
  invoices: defineTable({
    orderId: v.id("pendingOrders"),
    asaasPaymentId: v.string(),
    asaasInvoiceId: v.optional(v.string()), // Set when invoice is successfully created
    status: v.union(
      v.literal("pending"), // Invoice generation scheduled
      v.literal("processing"), // Being generated by Asaas
      v.literal("issued"), // Successfully issued
      v.literal("failed"), // Generation failed
      v.literal("cancelled"), // Cancelled
    ),
    municipalServiceId: v.string(), // Service ID from Asaas
    serviceDescription: v.string(),
    value: v.number(), // Always the TOTAL value (even for installment payments)
    // Installment information (for reference and observations only)
    installmentNumber: v.optional(v.number()), // Always 1 for installment payments (marks it as installment)
    totalInstallments: v.optional(v.number()), // Total number of installments (for payment info)
    customerName: v.string(),
    customerEmail: v.string(),
    customerCpfCnpj: v.string(),
    // Customer address (required for invoice generation - optional for migration)
    customerPhone: v.optional(v.string()),
    customerMobilePhone: v.optional(v.string()),
    customerPostalCode: v.optional(v.string()), // CEP
    customerAddress: v.optional(v.string()),
    customerAddressNumber: v.optional(v.string()), // Defaults to "SN" if not provided
    invoiceUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    issuedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_payment", ["asaasPaymentId"])
    .index("by_status", ["status"])
    .index("by_asaas_invoice", ["asaasInvoiceId"]),

  // Email invitations - tracks Clerk invitation emails sent after payment
  emailInvitations: defineTable({
    orderId: v.id("pendingOrders"),
    email: v.string(),
    customerName: v.string(),
    status: v.union(
      v.literal("pending"), // About to send
      v.literal("sent"), // Successfully sent
      v.literal("failed"), // Failed after all retries
      v.literal("accepted"), // User registered
    ),
    clerkInvitationId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    errorDetails: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()),
    retrierRunId: v.optional(v.string()), // Track the retrier run ID
  })
    .index("by_order", ["orderId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
});
