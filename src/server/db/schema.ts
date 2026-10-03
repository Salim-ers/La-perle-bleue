/**
 * Schéma PostgreSQL (Neon) — source des migrations SQL du dossier /drizzle.
 * Montants en centimes. Dates en UTC (timestamptz), affichées en heure de Paris.
 * Après modification : `npm run db:generate` puis `npm run db:migrate`.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
// Imports relatifs : drizzle-kit lit ce fichier hors de Next (sans alias « @/ »).
import type { Day, TimeRange } from "../../data/restaurant";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../../features/order/types";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const orderStatus = pgEnum("order_status", ORDER_STATUSES);
export const paymentStatus = pgEnum("payment_status", PAYMENT_STATUSES);

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const restaurantSettings = pgTable("restaurant_settings", {
  restaurantId: uuid("restaurant_id")
    .primaryKey()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  ordersEnabled: boolean("orders_enabled").notNull().default(true),
  preparationDelay: integer("preparation_delay").notNull().default(20),
  maxOrdersPerSlot: integer("max_orders_per_slot").notNull().default(6),
  openingHours: jsonb("opening_hours").$type<Record<Day, TimeRange[]>>().notNull(),
  updatedAt: updatedAt(),
});

/** Ruptures : un produit (id de la carte) ou une option (id global : « kebab », « coca-cola-zero »…). */
export const productAvailability = pgTable(
  "product_availability",
  {
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    itemType: text("item_type", { enum: ["product", "option"] }).notNull(),
    itemId: text("item_id").notNull(),
    available: boolean("available").notNull().default(true),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.itemType, t.itemId] })],
);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    /** Numéro court lu en cuisine (« #142 »). L'UUID reste interne. */
    orderNumber: integer("order_number").notNull().unique().generatedAlwaysAsIdentity({ startWith: 100 }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: orderStatus("status").notNull().default("PENDING_PAYMENT"),
    paymentStatus: paymentStatus("payment_status").notNull().default("PENDING"),
    fulfillment: text("fulfillment", { enum: ["PICKUP", "DELIVERY"] }).notNull().default("PICKUP"),
    pickupType: text("pickup_type", { enum: ["ASAP", "SCHEDULED"] }).notNull(),
    /** Heure de retrait prévue (estimée si « dès que possible »). */
    pickupTime: timestamp("pickup_time", { withTimezone: true }).notNull(),
    /** Créneau "HH:MM" (heure de Paris) : contrôle du nombre de commandes par créneau. */
    pickupSlot: text("pickup_slot").notNull(),
    subtotal: integer("subtotal").notNull(),
    total: integer("total").notNull(),
    notes: text("notes"),
    cancelReason: text("cancel_reason"),
    /** Tentative de paiement côté navigateur : un double clic ne crée qu'une commande. */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_status_idx").on(t.restaurantId, t.status),
    index("orders_slot_idx").on(t.restaurantId, t.pickupSlot, t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    totalPrice: integer("total_price").notNull(),
    note: text("note"),
    summary: jsonb("summary").$type<string[]>().notNull(),
    kitchenLines: jsonb("kitchen_lines").$type<string[]>().notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderItemOptions = pgTable(
  "order_item_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    groupId: text("group_id").notNull(),
    groupName: text("group_name").notNull(),
    optionId: text("option_id").notNull(),
    optionName: text("option_name").notNull(),
    priceDelta: integer("price_delta").notNull(),
  },
  (t) => [index("order_item_options_item_idx").on(t.orderItemId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["mollie", "mock"] }).notNull(),
    providerPaymentId: text("provider_payment_id").unique(),
    providerStatus: text("provider_status"),
    status: paymentStatus("status").notNull().default("PENDING"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("EUR"),
    checkoutUrl: text("checkout_url"),
    captureId: text("capture_id"),
    /** Verrou anti double capture (bouton ACCEPTER). */
    captureRequestedAt: timestamp("capture_requested_at", { withTimezone: true }),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    refundedAmount: integer("refunded_amount").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    paymentStatus: paymentStatus("payment_status"),
    actor: text("actor", { enum: ["customer", "kitchen", "webhook", "system"] }).notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

/** Un e-mail d'un type donné n'est envoyé qu'une fois par commande. */
export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status", { enum: ["sending", "sent", "failed", "skipped"] }).notNull(),
    providerId: text("provider_id"),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("email_log_order_type_idx").on(t.orderId, t.type)],
);

/** Journal : paiements, captures, refus, erreurs de webhook… */
export const eventLogs = pgTable(
  "event_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: text("level", { enum: ["info", "warn", "error"] }).notNull(),
    type: text("type").notNull(),
    orderId: uuid("order_id"),
    message: text("message").notNull(),
    data: jsonb("data"),
    createdAt: createdAt(),
  },
  (t) => [index("event_logs_created_idx").on(t.createdAt)],
);

/** Limitation de débit simple, sans Redis (fenêtres fixes). */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

// ——— Relations (requêtes cuisine en une seule requête SQL) ———

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  options: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(orderItemOptions, ({ one }) => ({
  item: one(orderItems, { fields: [orderItemOptions.orderItemId], references: [orderItems.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

