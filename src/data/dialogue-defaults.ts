import type { DialogueSequence } from "@/lib/site";

// Every built-in dialogue line, so admins can edit them in Sticker Controls. Runtime falls back to these.
const l = (line: string, expression = "hmm", stickerId?: string) => (stickerId ? { line, expression, stickerId } : { line, expression });

export const CART_EMPTY = [
  "ভাই, কার্টে বাতাস ছাড়া আর কিছু নাই!", "এইটা কী ভাই! কার্ট একদম খালি?", "এতক্ষণ ঘুরলেন, কিনলেন কী?",
  "ভাই, শুধু দেখলে তো হবে না… কিছু একটা নেন!", "কার্ট খালি রাখছেন কেন? মানুষজন কী ভাববে?", "একটা জিনিসও পছন্দ হলো না? সমস্যা আছে ভাই।",
  "এই কার্টের অবস্থা দেখে আমারই খারাপ লাগতেছে।", "ভাই, খালি হাতে যাইয়েন না… মান-সম্মান আছে।", "আপনি কি শপিং করতে আসছেন, নাকি ঘুরতে?",
].map((x) => l(x));
export const CART_ONE = [
  "একটা জিনিস নিয়া এত হিসাব কইরেন না ভাই!", "একটা নিলে হবে? আরেকটা নেন ভাই।", "এই একটা দিয়ে কী হবে? আরেকটা দেন।",
  "ভাই, যেহেতু শুরু করছেন… শেষ করেন।", "একটা জিনিস নিয়া এত খুশি হওয়ার কী আছে?", "আরেকটা নেন। পরে আফসোস করবেন।",
  "ভাই, কার্টে জায়গা আছে… সমস্যা কোথায়?", "একটা আপনার জন্য, একটা বাসার জন্য—বুদ্ধি করে চলেন।", "এইটা ভালো হইছে… এখন আরেকটা নেন।",
].map((x) => l(x));
export const CART_MANY = [l("এইবার হইছে। মানুষজনের মতো লাগতেছে।", "laugh"), l("এইবার টাকা দেন… এত চিন্তা করলে ব্যবসা চলে?", "unimpressed")];
export const CART_HIGH = [l("ভাই… জিনিস ভালো লাগছে বুঝলাম, কিন্তু এতগুলা?", "nervous")];
export const CART_LOW = [l("এই টাকায় তো ঠিকমতো নাশতাও হয় না!", "unimpressed")];
export const CART_REMOVED = [l("এইটা বাদ দিলেন ক্যান? আপনার রুচি নিয়ে সন্দেহ হইতেছে।", "facepalm")];

export const CHECKOUT_IDLE_HIGH = ["ভাই… হিসাবটা আরেকবার দেখবেন?", "এতগুলা জিনিস লাগবে আপনার?", "ভাই, বাজেটের ভিতরে আছেন তো?", "টাকা আছে তো?"].map((x) => l(x, "nervous"));
export const CHECKOUT_IDLE_ONE = ["একটা জিনিস নিয়া যাবেন?", "আরেকটা নিলে খারাপ কী?", "ভাই, একটা দিয়ে কী হবে?"].map((x) => l(x, "pointing"));
export const CHECKOUT_IDLE = ["ভাই… আর কত ভাববেন?", "নিবেন যখন, তখন নেন।", "সিদ্ধান্ত নিতে এত সময় লাগে?"].map((x) => l(x, "unimpressed"));

export const VISITOR_JOKES = [
  "Cart ko dekha? It is feeling emotionally empty.", "Tiny object, giant explanation. Excellent choice.", "I inspected the vibes. Approved with mild confusion.",
  "My glasses say yes. My back says think about it.", "Wallet called. I told it we don't take calls from strangers.", "Such a small thing. Such a big problem for my pocket.",
  "I am not saying don't buy it. I am saying don't tell anyone.", "Everyone has this. Except everyone. Only you have this.",
  "I checked the quality. Twice. Then I checked the price and sat down.", "Hmm. Suspiciously good. Nobody is this generous. Buy two.",
].map((x) => l(x, "hmm", "shop-character"));

const seq = (id: string, name: string, trigger: string, priority: 0 | 1 | 2, lines: DialogueSequence["lines"]): DialogueSequence => ({ id, name, trigger, priority, enabled: true, lines });

export const DEFAULT_SEQUENCES: DialogueSequence[] = [
  seq("cart-empty", "Cart · empty", "Cart open with nothing inside (cycles one line at a time)", 0, CART_EMPTY),
  seq("cart-single", "Cart · one item", "Cart open with one item (cycles)", 0, CART_ONE),
  seq("cart-many", "Cart · several items", "Cart open with 2+ items (cycles)", 0, CART_MANY),
  seq("cart-high", "Cart · big total", "Cart total 50 or more", 0, CART_HIGH),
  seq("cart-low", "Cart · tiny total", "One cheap item in cart", 0, CART_LOW),
  seq("cart-remove", "Cart · item removed", "Item removed from cart", 2, CART_REMOVED),
  seq("checkout-entry", "Checkout · welcome", "Checkout page opens", 1, [l("এইবার আর পেছনে তাকাইয়েন না।", "shush")]),
  seq("checkout-idle-high", "Checkout · idle, big total", "No typing for 15s, total 50+ (cycles)", 0, CHECKOUT_IDLE_HIGH),
  seq("checkout-idle-one", "Checkout · idle, one item", "No typing for 15s, one item (cycles)", 0, CHECKOUT_IDLE_ONE),
  seq("checkout-idle", "Checkout · idle", "No typing for 15s (cycles)", 0, CHECKOUT_IDLE),
  seq("checkout-payment", "Checkout · pay first (bKash)", "Payment switched to bKash", 1, [l("ওহ! আগেই মিটায় ফেললেন?", "shocked"), l("বাহ, বিশ্বাস আছে দেখতেছি!", "laugh")]),
  seq("checkout-payment-cod", "Checkout · back to cash", "Payment switched back to cash on delivery", 1, [l("আগে দিতে চাইলেন, এখন আবার পরে?"), l("সিদ্ধান্তটা একটু নড়বড়ে মনে হইতেছে।", "unimpressed")]),
  seq("checkout-error", "Checkout · missing info", "Form submitted with missing details", 2, [l("ভাই, কিছু তথ্য তো লাগবো।", "nervous"), l("নাম-ঠিকানা ছাড়া জিনিস পাঠামু কই?", "facepalm")]),
  seq("grandpa-popup", "Visitor popup", "Shop, product and about pages after 7 seconds (one random line)", 0, VISITOR_JOKES),
];
