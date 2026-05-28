import { SimplePage } from "../_components/SimplePage";

export const metadata = { title: "Atendimento · HYPADO" };

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";
const IG = process.env.NEXT_PUBLIC_INSTAGRAM || "hypado_of";

export default function ContatoPage() {
  return (
    <SimplePage eyebrow="Atendimento" title="Fala com a gente.">
      <p>
        Atendimento humano, de segunda a sábado, das 9h às 19h. Respondemos rapidinho.
      </p>
      <ul className="space-y-3 not-italic">
        <li>
          <span className="text-muted">WhatsApp · </span>
          <a
            href={`https://wa.me/${WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            +{WA}
          </a>
        </li>
        <li>
          <span className="text-muted">Instagram · </span>
          <a
            href={`https://instagram.com/${IG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            @{IG}
          </a>
        </li>
        <li>
          <span className="text-muted">E-mail · </span>
          <a
            href="mailto:contato@hypado.com.br"
            className="underline underline-offset-4 hover:text-foreground"
          >
            contato@hypado.com.br
          </a>
        </li>
      </ul>
      <p className="text-muted text-xs md:text-sm">
        Trocas em até 7 dias após o recebimento, peça sem uso e com etiqueta.
      </p>
    </SimplePage>
  );
}
