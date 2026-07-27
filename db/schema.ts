import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
};

export const stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  documentMasked: text("document_masked"),
  timezone: text("timezone").notNull().default("America/Fortaleza"),
  currency: text("currency").notNull().default("BRL"),
  environment: text("environment").notNull().default("DEMO"),
  ...timestamps,
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    role: text("role").notNull(),
    avatarUrl: text("avatar_url"),
    status: text("status").notNull().default("ACTIVE"),
    passwordHash: text("password_hash"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_store_email_unique").on(table.storeId, table.email),
    index("users_store_role_idx").on(table.storeId, table.role),
  ],
);

export const sellerProfiles = sqliteTable("seller_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerCode: text("seller_code").notNull().unique(),
  commissionRateBps: integer("commission_rate_bps").notNull().default(0),
  notificationPreferences: text("notification_preferences", { mode: "json" }),
  ...timestamps,
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    ipAddressMasked: text("ip_address_masked"),
    userAgentHash: text("user_agent_hash"),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("sessions_user_expires_idx").on(table.userId, table.expiresAt),
  ],
);

export const sales = sqliteTable(
  "sales",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    customerDocumentMasked: text("customer_document_masked"),
    description: text("description").notNull(),
    internalReference: text("internal_reference").notNull(),
    originalAmount: integer("original_amount").notNull(),
    finalAmount: integer("final_amount").notNull(),
    uniqueCents: integer("unique_cents"),
    currency: text("currency").notNull().default("BRL"),
    status: text("status").notNull(),
    notes: text("notes"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sales_store_reference_unique").on(
      table.storeId,
      table.internalReference,
    ),
    index("sales_store_status_created_idx").on(
      table.storeId,
      table.status,
      table.createdAt,
    ),
    index("sales_seller_status_idx").on(table.sellerId, table.status),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    environment: text("environment").notNull(),
    providerOrderId: text("provider_order_id").notNull(),
    providerChargeId: text("provider_charge_id"),
    providerQrCodeId: text("provider_qr_code_id"),
    providerNotificationId: text("provider_notification_id"),
    endToEndId: text("end_to_end_id"),
    referenceId: text("reference_id").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("BRL"),
    status: text("status").notNull(),
    payerName: text("payer_name"),
    payerDocumentMasked: text("payer_document_masked"),
    pixCopyPasteEncrypted: text("pix_copy_paste_encrypted"),
    qrCodeImageUrl: text("qr_code_image_url"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    verificationMethod: text("verification_method"),
    verificationAttempts: integer("verification_attempts").notNull().default(0),
    lastVerificationError: text("last_verification_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_provider_order_unique").on(
      table.environment,
      table.provider,
      table.providerOrderId,
    ),
    uniqueIndex("payments_provider_charge_unique").on(
      table.environment,
      table.provider,
      table.providerChargeId,
    ),
    index("payments_store_status_idx").on(table.storeId, table.status),
  ],
);

export const webhookEvents = sqliteTable(
  "payment_webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    environment: text("environment").notNull(),
    providerEventId: text("provider_event_id"),
    eventType: text("event_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    sanitizedPayload: text("sanitized_payload", { mode: "json" }).notNull(),
    processingStatus: text("processing_status").notNull(),
    receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
    processedAt: integer("processed_at", { mode: "timestamp" }),
    errorMessage: text("error_message"),
  },
  (table) => [
    uniqueIndex("webhook_payload_unique").on(
      table.provider,
      table.environment,
      table.payloadHash,
    ),
  ],
);

export const webhookJobs = sqliteTable(
  "webhook_jobs",
  {
    id: text("id").primaryKey(),
    webhookEventId: text("webhook_event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: integer("next_attempt_at", { mode: "timestamp" }),
    lastError: text("last_error"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("webhook_jobs_status_next_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    saleId: text("sale_id").references(() => sales.id),
    paymentId: text("payment_id").references(() => payments.id),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    readAt: integer("read_at", { mode: "timestamp" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const reconciliationCases = sqliteTable(
  "reconciliation_cases",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    saleId: text("sale_id").references(() => sales.id),
    paymentId: text("payment_id").references(() => payments.id),
    reason: text("reason").notNull(),
    status: text("status").notNull(),
    confidenceScore: integer("confidence_score"),
    assignedTo: text("assigned_to").references(() => users.id),
    resolution: text("resolution"),
    resolvedBy: text("resolved_by").references(() => users.id),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("reconciliation_store_status_idx").on(table.storeId, table.status),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    actorUserId: text("actor_user_id").references(() => users.id),
    actorType: text("actor_type").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata", { mode: "json" }),
    ipAddressMasked: text("ip_address_masked"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("audit_store_created_idx").on(table.storeId, table.createdAt),
  ],
);

export const integrationSettings = sqliteTable(
  "integration_settings",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    provider: text("provider").notNull(),
    environment: text("environment").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    webhookStatus: text("webhook_status").notNull().default("NOT_CONFIGURED"),
    lastSuccessfulRequestAt: integer("last_successful_request_at", {
      mode: "timestamp",
    }),
    lastSuccessfulWebhookAt: integer("last_successful_webhook_at", {
      mode: "timestamp",
    }),
    lastErrorAt: integer("last_error_at", { mode: "timestamp" }),
    lastErrorMessage: text("last_error_message"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("integration_store_provider_env_unique").on(
      table.storeId,
      table.provider,
      table.environment,
    ),
  ],
);

export const idempotencyKeys = sqliteTable(
  "idempotency_keys",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    scope: text("scope").notNull(),
    keyHash: text("key_hash").notNull(),
    response: text("response", { mode: "json" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idempotency_store_scope_key_unique").on(
      table.storeId,
      table.scope,
      table.keyHash,
    ),
  ],
);

export const outboxEvents = sqliteTable(
  "outbox_events",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    eventType: text("event_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    status: text("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("outbox_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const paymentVerificationAttempts = sqliteTable(
  "payment_verification_attempts",
  {
    id: text("id").primaryKey(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    outcome: text("outcome").notNull(),
    reasons: text("reasons", { mode: "json" }),
    providerStatus: text("provider_status"),
    latencyMs: integer("latency_ms"),
    errorMessage: text("error_message"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("verification_payment_created_idx").on(
      table.paymentId,
      table.createdAt,
    ),
  ],
);
