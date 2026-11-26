// What staff and customers SEE for each payment. DB values stay "online" / "cash".
//   online → paid on the spot through Razorpay
//   cash   → guest pays at the counter after the meal (cash or UPI, we can't know which)
export const PAY_WORDS = {
  online: { short: "Online", done: "Paid online" },
  cash: { short: "At counter", done: "Paid at counter" },
};
export const payShort = (method) => PAY_WORDS[method]?.short ?? "—";
export const payDone = (method) => PAY_WORDS[method]?.done ?? "—";