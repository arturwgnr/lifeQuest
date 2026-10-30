// The app never shows the em dash (U+2014). Every Gemini prompt carries
// NO_EM_DASH_RULE, and every piece of AI text passes through stripEmDash
// before it's saved or returned, as a safety net for when the model slips.
const EM_DASH = String.fromCharCode(0x2014);
const EM_DASH_RUN = new RegExp(`\\s*${EM_DASH}\\s*`, "g");

const NO_EM_DASH_RULE = `Never use the em dash character (${EM_DASH}) anywhere in your replies, questions, task titles, notes or suggestions. Use a comma, a period, a colon or parentheses instead.`;

function stripEmDash(text) {
  if (typeof text !== "string" || !text.includes(EM_DASH)) return text;
  return text
    .replace(EM_DASH_RUN, ", ")
    .replace(/,\s*([.,;:!?)])/g, "$1")
    .replace(/^,\s*/, "")
    .replace(/,\s*$/, "");
}

module.exports = { NO_EM_DASH_RULE, stripEmDash };
