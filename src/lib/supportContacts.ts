// Confirm these contact values with the service provider before publishing.
export const SUPPORT_PHONE = (import.meta.env.VITE_SUPPORT_PHONE as string | undefined)?.trim() || "032 610 6800";
export const SUPPORT_WHATSAPP = (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined)?.trim() || "256758073035";
export const SUPPORT_PHONE_HREF = `tel:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`;
export const SUPPORT_WHATSAPP_DIGITS = SUPPORT_WHATSAPP.replace(/\D/g, "");
export const SUPPORT_WHATSAPP_HREF = `https://wa.me/${SUPPORT_WHATSAPP_DIGITS}`;
