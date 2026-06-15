import Link from "next/link";
import { SimplePage } from "../_components/SimplePage";

export const metadata = { title: "Políticas · HYPADO" };

export default function PoliticaPage() {
  return (
    <SimplePage eyebrow="Políticas" title="Trocas, envios e privacidade.">
      <h2 className="text-lg md:text-xl font-medium text-foreground mt-2">Trocas e devoluções</h2>
      <p>
        Você pode pedir troca em até 7 dias corridos após o recebimento, com a peça sem
        uso e com etiqueta. O envio da troca é por conta da HYPADO uma única vez por
        pedido.
      </p>

      <h2 className="text-lg md:text-xl font-medium text-foreground mt-6">Envio</h2>
      <p>
        Enviamos pra todo o Brasil via Correios e transportadoras parceiras. Pedidos são
        processados em até 2 dias úteis. Prazo de entrega varia por região, informado no
        fechamento pelo WhatsApp.
      </p>

      <h2 className="text-lg md:text-xl font-medium text-foreground mt-6">Privacidade e dados (LGPD)</h2>
      <p>
        Coletamos apenas o necessário pra processar o pedido (nome, endereço, contato) e
        respeitamos os seus direitos como titular. Para entender em detalhe quais dados
        tratamos, por que, com quem compartilhamos e como exercer seus direitos, veja a
        nossa{" "}
        <Link href="/privacidade" className="text-foreground underline underline-offset-4">
          Política de Privacidade completa
        </Link>
        .
      </p>
    </SimplePage>
  );
}
