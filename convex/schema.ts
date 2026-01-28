import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  // ============================================================================
  // MULTITENANCY TABLES
  // ============================================================================

  // Tenants table - represents organizations/companies
  tenants: defineTable({
    name: v.string(),
    slug: v.string(), // subdomain identifier (e.g., "acme" for acme.ortoclub.com)
    domain: v.optional(v.string()), // Full domain URL (e.g., "teot.ortoclub.com")
    displayName: v.optional(v.string()), // Name displayed next to logo (can differ from name)
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()), // Primary brand color (replaces --blue-brand CSS variable)
    status: v.union(v.literal("active"), v.literal("suspended")),
  })
    .index("by_slug", ["slug"])
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),

  // Tenant memberships - links users to tenants with roles
  tenantMemberships: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    role: v.union(v.literal("member"), v.literal("admin")),
    // Tenant-specific access control
    hasActiveAccess: v.boolean(), // Whether user has active access in this tenant
    accessExpiresAt: v.optional(v.number()), // When access expires
    joinedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_userId_and_tenantId", ["userId", "tenantId"])
    .index("by_tenantId_and_role", ["tenantId", "role"]),

  // ============================================================================
  // USER TABLE
  // ============================================================================

  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("superadmin"),
    ),
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

  // ============================================================================
  // CONTENT TABLES (tenant-scoped)
  // ============================================================================

  // Categories table
  categories: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    position: v.number(),
    iconUrl: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    // Tenant-scoped indices only (multitenancy requirement)
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_position", ["tenantId", "position"])
    .index("by_tenantId_and_slug", ["tenantId", "slug"])
    .index("by_tenantId_and_isPublished", ["tenantId", "isPublished"]),

  // Units table (formerly modules/courses)
  units: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
    categoryId: v.id("categories"),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    order_index: v.number(),
    totalLessonVideos: v.number(),
    lessonCounter: v.optional(v.number()), // Atomic counter for lesson order_index allocation
    lessonNumberCounter: v.optional(v.number()), // Atomic counter for lesson number allocation (prevents race conditions)
    isPublished: v.boolean(),
  })
    .index("by_categoryId", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_categoryId_and_order", ["categoryId", "order_index"])
    .index("by_isPublished", ["isPublished"])
    .index("by_categoryId_and_isPublished", ["categoryId", "isPublished"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_categoryId", ["tenantId", "categoryId"])
    .index("by_tenantId_and_isPublished", ["tenantId", "isPublished"]),

  // Lessons table (video lessons)
  lessons: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
    unitId: v.id("units"),
    categoryId: v.id("categories"), // Denormalized for efficient querying
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    videoId: v.optional(v.string()), // Bunny video ID
    thumbnailUrl: v.optional(v.string()), // ImageKit thumbnail URL
    durationSeconds: v.number(),
    order_index: v.number(),
    lessonNumber: v.number(),
    isPublished: v.boolean(),
  })
    .index("by_unitId", ["unitId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_slug", ["slug"])
    .index("by_unitId_and_order", ["unitId", "order_index"])
    .index("by_categoryId_and_order", ["categoryId", "order_index"])
    .index("by_isPublished", ["isPublished"])
    .index("by_unitId_isPublished_order", [
      "unitId",
      "isPublished",
      "order_index",
    ])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_unitId", ["tenantId", "unitId"])
    .index("by_tenantId_isPublished", ["tenantId", "isPublished"]),

  // Videos table (Bunny Stream videos)
  videos: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
    videoId: v.string(), // Bunny video ID
    libraryId: v.string(), // Bunny library ID
    title: v.string(),
    description: v.string(),
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
        extras: v.optional(
          v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null()),
          ),
        ), // Additional dynamic fields (string, number, boolean or null)
      }),
    ),
  })
    .index("by_videoId", ["videoId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_videoId", ["tenantId", "videoId"]),

  // ============================================================================
  // USER PROGRESS TABLES (tenant-scoped)
  // ============================================================================

  // User progress per lesson (granular tracking)
  userProgress: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_userId_and_completed", ["userId", "completed"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_userId", ["tenantId", "userId"])
    .index("by_tenantId_and_userId_and_lessonId", [
      "tenantId",
      "userId",
      "lessonId",
    ]),

  // Aggregated progress per unit (for quick unit progress queries)
  unitProgress: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_userId_and_progressPercent", ["userId", "progressPercent"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_userId", ["tenantId", "userId"])
    .index("by_tenantId_and_userId_and_unitId", [
      "tenantId",
      "userId",
      "unitId",
    ]),

  // Global user progress (for dashboard/home quick view)
  userGlobalProgress: defineTable({
    tenantId: v.id("tenants"), // Tenant context
    userId: v.string(), // clerkUserId
    completedLessonsCount: v.number(),
    progressPercent: v.number(), // 0-100
    updatedAt: v.number(), // timestamp of last update
  })
    .index("by_userId", ["userId"])
    .index("by_progressPercent", ["progressPercent"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_userId", ["tenantId", "userId"]),

  // Favorites (user's favorite lessons)
  favorites: defineTable({
    tenantId: v.id("tenants"), // Tenant context
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_userId", ["tenantId", "userId"])
    .index("by_tenantId_userId_lessonId", ["tenantId", "userId", "lessonId"]),

  // Recent views (user's recent lesson views)
  recentViews: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_userId", ["tenantId", "userId"])
    .index("by_tenantId_userId_lessonId", ["tenantId", "userId", "lessonId"]),

  // Content statistics moved to Aggregate component
  // See convex/aggregate.ts for the new implementation using @convex-dev/aggregate

  // Category position counter (atomic counter for category positions)
  categoryPositionCounter: defineTable({
    counterId: v.string(), // unique identifier to enforce single-counter document
    nextPosition: v.number(), // next available position for categories
  }).index("by_counterId", ["counterId"]),

  // Lesson feedback (user feedback/questions about lessons)
  lessonFeedback: defineTable({
    tenantId: v.id("tenants"), // Tenant context
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    feedback: v.string(), // user's feedback or question
    createdAt: v.number(), // timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_lessonId", ["tenantId", "lessonId"]),

  // Lesson ratings (user star ratings for lessons)
  lessonRatings: defineTable({
    tenantId: v.id("tenants"), // Tenant context
    userId: v.string(), // clerkUserId
    lessonId: v.id("lessons"),
    unitId: v.id("units"),
    rating: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ), // 1-5 stars
  })
    .index("by_userId", ["userId"])
    .index("by_lessonId", ["lessonId"])
    .index("by_userId_and_lessonId", ["userId", "lessonId"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_lessonId", ["tenantId", "lessonId"]),
  // Admin-managed coupons for checkout
  coupons: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
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
  })
    .index("by_code", ["code"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_code", ["tenantId", "code"]),

  // Coupon usage tracking
  couponUsage: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_cpf", ["userCpf"])
    .index("by_tenantId", ["tenantId"]),

  // Pricing plans
  pricingPlans: defineTable({
    tenantId: v.id("tenants"), // Tenant ownership
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
    productId: v.string(), // e.g., "Ortoclub_2025", "Ortoclub_2026", "premium_pack" - REQUIRED
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
    .index("by_active", ["isActive"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_productId", ["tenantId", "productId"]),
  // Waitlist - tracks users interested in OrtoClub TEOT
  waitlist: defineTable({
    tenantId: v.optional(v.id("tenants")), // Tenant ownership (optional for backward compatibility)
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
  })
    .index("by_email", ["email"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_email", ["tenantId", "email"]),

  // ============================================================================
  // ORDER AND PAYMENT TABLES (tenant-scoped)
  // ============================================================================

  // Pending orders - tracks checkout sessions and payment lifecycle
  pendingOrders: defineTable({
    tenantId: v.id("tenants"), // Tenant context

    // Contact info (from checkout)
    email: v.string(), // Contact email from checkout
    cpf: v.string(),
    name: v.string(),
    productId: v.string(), // Product identifier (e.g., "Ortoclub_2025")

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
    .index("by_account_email", ["accountEmail"])
    .index("by_status", ["status"])
    .index("by_asaas_payment", ["asaasPaymentId"])
    .index("by_external_reference", ["externalReference"])
    .index("by_tenantId", ["tenantId"])
    .index("by_tenantId_and_status", ["tenantId", "status"]),

  // Invoices - tracks nota fiscal (invoice) generation for paid orders
  // IMPORTANT: For installment payments, ONE invoice is generated with the TOTAL value
  invoices: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_asaas_invoice", ["asaasInvoiceId"])
    .index("by_tenantId", ["tenantId"]),

  // Email invitations - tracks Clerk invitation emails sent after payment
  emailInvitations: defineTable({
    tenantId: v.id("tenants"), // Tenant context
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
    .index("by_status", ["status"])
    .index("by_tenantId", ["tenantId"]),
});
