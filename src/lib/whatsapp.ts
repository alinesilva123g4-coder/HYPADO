export function whatsappLink(message: string, number?: string) {
  const target =
    number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}
