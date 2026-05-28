export function whatsappLink(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
