/**
 * Tests de la logique de commande (sans navigateur ni base) : `npm run test:logic`.
 * Couvre les prix, les règles du configurateur, la validation et les créneaux.
 */
import assert from "node:assert/strict";
import { getProduct, withAvailability } from "../src/features/order/catalog";
import { priceOrder } from "../src/features/order/checkout";
import { computePickupAvailability } from "../src/features/order/pickup";
import {
  calculateConfiguredProductPrice,
  describeForKitchen,
  describeSelection,
  getDefaultSelection,
  normalizeSelection,
  selectionKey,
} from "../src/features/order/pricing";
import { checkoutRequestSchema } from "../src/features/order/schemas";
import { validateSelection } from "../src/features/order/validation";
import { restaurant } from "../src/data/restaurant";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}
const product = (id: string) => {
  const p = getProduct(id);
  assert.ok(p, `produit ${id}`);
  return p;
};
const noLive = { unavailableProducts: [], unavailableOptions: [] };

test("Sandwich seul : pain par défaut, crudités cochées, prix de base", () => {
  const p = product("sandwich-merguez");
  const sel = getDefaultSelection(p);
  assert.deepEqual(sel.pain, ["pain"]);
  assert.deepEqual(sel.crudites, ["salade", "tomates", "oignons"]);
  assert.deepEqual(validateSelection(p, sel), {});
  assert.equal(calculateConfiguredProductPrice(p, sel).unitPrice, 550);
});

test("Sandwich sans oignons, galette, 2 sauces, cheddar", () => {
  const p = product("sandwich-merguez");
  const sel = { ...getDefaultSelection(p), pain: ["galette"], crudites: ["salade", "tomates"], sauces: ["blanche", "algerienne"], supplements: ["cheddar"] };
  assert.deepEqual(validateSelection(p, sel), {});
  const price = calculateConfiguredProductPrice(p, sel, 2);
  assert.deepEqual(price, { basePrice: 550, optionsPrice: 50, unitPrice: 600, total: 1200 });
  assert.deepEqual(describeSelection(p, sel), ["Galette", "Sans oignons", "Sauces : Blanche, Algérienne", "Suppléments : Cheddar"]);
  assert.ok(describeForKitchen(p, sel).some((l) => l.includes("SANS OIGNONS")));
  assert.ok(describeForKitchen(p, sel).includes("Pain : Galette"));
});

test("Troisième sauce facturée en supplément", () => {
  const p = product("sandwich-merguez");
  const sel = { ...getDefaultSelection(p), sauces: ["blanche", "algerienne", "harissa"] };
  assert.equal(calculateConfiguredProductPrice(p, sel).optionsPrice, 50);
  assert.ok(validateSelection(p, { ...sel, sauces: ["blanche", "algerienne", "harissa", "ketchup"] }).sauces);
});

test("Menu : boisson obligatoire, impossible sans boisson", () => {
  const p = product("sandwich-merguez");
  const menu = normalizeSelection(p, { ...getDefaultSelection(p), formule: ["menu"] });
  assert.ok(validateSelection(p, menu).boisson, "boisson exigée");
  const ok = { ...menu, boisson: ["coca-cola-zero"] };
  assert.deepEqual(validateSelection(p, ok), {});
  assert.equal(calculateConfiguredProductPrice(p, ok).unitPrice, 700);
});

test("Boisson refusée hors menu (groupe masqué)", () => {
  const p = product("sandwich-merguez");
  const sel = { ...getDefaultSelection(p), boisson: ["coca-cola"] };
  assert.ok(validateSelection(p, sel).boisson);
  assert.deepEqual(normalizeSelection(p, sel).boisson, []);
});

test("Berliner : frites à côté, jamais facturées deux fois en menu", () => {
  const p = product("berliner-kebab");
  const seul = { ...getDefaultSelection(p), frites: ["frites-a-cote"] };
  assert.equal(calculateConfiguredProductPrice(p, seul).unitPrice, 750);
  // Passage en menu : le groupe frites est masqué et vidé, seul le prix du menu compte.
  const menu = normalizeSelection(p, { ...seul, formule: ["menu"], boisson: ["fanta-orange"] });
  assert.deepEqual(menu.frites, []);
  assert.equal(calculateConfiguredProductPrice(p, menu).unitPrice, 900);
  assert.ok(validateSelection(p, { ...menu, frites: ["frites-a-cote"] }).frites, "frites refusées en menu");
});

test("Burger menu : frites + boisson", () => {
  const p = product("cheese-burger");
  const sel = { ...getDefaultSelection(p), formule: ["menu"], boisson: ["coca-cola"] };
  assert.deepEqual(validateSelection(p, sel), {});
  assert.equal(calculateConfiguredProductPrice(p, sel).unitPrice, 1000);
});

test("Assiette : crudités retirables ; RS4 sans crudités", () => {
  assert.ok(product("assiette-kebab").optionGroups.some((g) => g.id === "crudites"));
  assert.ok(!product("assiette-rs4").optionGroups.some((g) => g.id === "crudites"));
});

test("Tacos : nombre de viandes selon la taille", () => {
  const p = product("tacos");
  const two = { ...getDefaultSelection(p), taille: ["2-viandes"], viandes: ["kebab"] };
  assert.ok(validateSelection(p, two).viandes);
  const ok = { ...two, viandes: ["kebab", "tenders"], sauces: ["samourai"], supplements: ["cheddar"] };
  assert.deepEqual(validateSelection(p, ok), {});
  assert.equal(calculateConfiguredProductPrice(p, ok).unitPrice, 750);
  assert.deepEqual(normalizeSelection(p, { ...ok, taille: ["1-viande"] }).viandes, ["kebab"]);
});

test("Lignes distinctes : options différentes = clés différentes", () => {
  const p = product("sandwich-merguez");
  const a = getDefaultSelection(p);
  const b = { ...a, crudites: ["salade"] };
  assert.notEqual(selectionKey(a), selectionKey(b));
  assert.equal(selectionKey({ ...a, boisson: [] }), selectionKey(a));
});

test("Ruptures : produit et option refusés", () => {
  const p = withAvailability(product("tacos"), { unavailableProducts: [], unavailableOptions: ["tenders"] });
  const sel = { ...getDefaultSelection(p), taille: ["2-viandes"], viandes: ["kebab", "tenders"] };
  assert.ok(validateSelection(p, sel).viandes);
  const priced = priceOrder([{ productId: "tacos", options: sel, quantity: 1 }], { unavailableProducts: [], unavailableOptions: ["tenders"] });
  assert.equal(priced.ok, false);
  const off = priceOrder([{ productId: "canette", options: { parfum: ["coca-cola"] }, quantity: 1 }], { unavailableProducts: ["canette"], unavailableOptions: [] });
  assert.equal(off.ok, false);
});

test("Anti-triche : le serveur recalcule, les prix envoyés sont ignorés", () => {
  const parsed = checkoutRequestSchema.safeParse({
    attemptId: "0b8f3e0e-6a1d-4c6e-9b8a-3f0c2f6b1a11",
    items: [{ productId: "assiette-mixte", options: { sauces: ["blanche"] }, quantity: 2, price: 1, total: 1 }],
    customer: { firstName: "Test", lastName: "Client", phone: "06 12 34 56 78", email: "T@EX.FR" },
    pickup: { type: "ASAP" },
    fulfillment: "PICKUP",
    total: 1,
  });
  assert.ok(parsed.success);
  assert.ok(!("price" in parsed.data.items[0]), "champ prix supprimé");
  const priced = priceOrder(parsed.data.items.map((i) => ({ ...i, options: { ...getDefaultSelection(product("assiette-mixte")), ...i.options } })), noLive);
  assert.ok(priced.ok && priced.total === 2800);
  assert.equal(parsed.data.customer.email, "t@ex.fr");
  assert.equal(parsed.data.customer.phone, "0612345678");
});

test("Validation : quantité, identifiants et options inventées refusés", () => {
  const base = { attemptId: "0b8f3e0e-6a1d-4c6e-9b8a-3f0c2f6b1a11", customer: { firstName: "a", lastName: "b", phone: "0612345678", email: "a@b.fr" }, pickup: { type: "ASAP" }, fulfillment: "PICKUP" };
  assert.ok(!checkoutRequestSchema.safeParse({ ...base, items: [{ productId: "tacos", options: {}, quantity: 0 }] }).success);
  assert.ok(!checkoutRequestSchema.safeParse({ ...base, items: [{ productId: "TACOS;DROP", options: {}, quantity: 1 }] }).success);
  const p = product("tacos");
  assert.ok(validateSelection(p, { ...getDefaultSelection(p), viandes: ["caviar"] }).viandes);
});

test("Créneaux : fermé, pause, délai et capacité", () => {
  const base = { hours: restaurant.openingHours, ordersEnabled: true, preparationDelay: 20, maxOrdersPerSlot: 2, slotCounts: {} };
  const noon = computePickupAvailability({ ...base, now: { dayIndex: 0, minutes: 12 * 60 + 7 } });
  assert.equal(noon.asap.available, true);
  assert.equal(noon.asap.readyAt, "12:27");
  assert.equal(noon.slots[0].time, "12:30");
  const full = computePickupAvailability({ ...base, now: { dayIndex: 0, minutes: 12 * 60 + 7 }, slotCounts: { "12:30": 2 } });
  assert.equal(full.slots[0].available, false);
  assert.equal(full.asap.available, false, "créneau de l'ASAP complet");
  const sunday = computePickupAvailability({ ...base, now: { dayIndex: 6, minutes: 13 * 60 } });
  assert.equal(sunday.slots.length, 0);
  const paused = computePickupAvailability({ ...base, ordersEnabled: false, now: { dayIndex: 0, minutes: 13 * 60 } });
  assert.equal(paused.asap.available || paused.slots.length > 0, false);
  const late = computePickupAvailability({ ...base, now: { dayIndex: 1, minutes: 22 * 60 + 50 } });
  assert.equal(late.asap.available, false);
});

console.log(`\n${passed} tests réussis.`);
