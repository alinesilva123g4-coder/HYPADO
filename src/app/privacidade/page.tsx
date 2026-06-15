import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade · HYPADO",
  description:
    "Como a HYPADO coleta, usa, compartilha e protege seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
};

// Dados do controlador — ajuste a razão social e preencha o CNPJ quando registrar a empresa.
const RAZAO_SOCIAL = "HYPADO Streetwear";
const CNPJ = ""; // ex.: "00.000.000/0001-00" — deixe vazio para não exibir a linha
const EMAIL = "contato@hypado.com.br";
const ATUALIZADO_EM = "8 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 md:px-6 pt-10 md:pt-16 pb-14 md:pb-24">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted">LGPD · Lei nº 13.709/2018</div>
      <h1 className="gothic mt-3 md:mt-4 text-4xl md:text-6xl text-foreground">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-xs md:text-sm text-muted">
        Última atualização: {ATUALIZADO_EM}
      </p>

      <div className="mt-6 md:mt-10 text-sm md:text-base leading-relaxed text-foreground/80 space-y-4">
        <p>
          A sua privacidade é prioridade para a HYPADO. Esta Política explica, de forma
          clara e transparente, quais dados pessoais coletamos, por que os usamos, com
          quem compartilhamos e quais são os seus direitos como titular, em conformidade
          com a <strong className="text-foreground">Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018 — LGPD)</strong>.
        </p>
      </div>

      <Section title="1. Quem é o responsável pelos seus dados (Controlador)">
        <p>
          O responsável pelo tratamento dos seus dados pessoais é a{" "}
          <strong className="text-foreground">{RAZAO_SOCIAL}</strong>
          {CNPJ ? `, inscrita no CNPJ sob o nº ${CNPJ}` : ""}, doravante denominada
          “HYPADO”.
        </p>
        <p>
          Para qualquer assunto relacionado à proteção de dados — incluindo dúvidas,
          solicitações ou o exercício dos seus direitos — você pode falar com o nosso
          Encarregado de Proteção de Dados (DPO) pelo e-mail{" "}
          <a href={`mailto:${EMAIL}`} className="text-foreground underline underline-offset-4">
            {EMAIL}
          </a>{" "}
          ou pelo nosso WhatsApp de atendimento.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>Coletamos apenas os dados necessários para cada finalidade. São eles:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-muted">
          <li>
            <strong className="text-foreground">Dados de pedido e contato:</strong> nome,
            endereço de entrega, telefone/WhatsApp e e-mail, fornecidos por você ao
            finalizar uma compra ou ao falar com a gente.
          </li>
          <li>
            <strong className="text-foreground">Dados de cadastro/newsletter:</strong>{" "}
            nome, telefone e, opcionalmente, data de nascimento, quando você se inscreve
            para receber novidades e ofertas.
          </li>
          <li>
            <strong className="text-foreground">Dados de navegação e uso:</strong>{" "}
            páginas e produtos visitados, itens adicionados à sacola, identificador
            anônimo de sessão, endereço IP, tipo de dispositivo e navegador. Usamos esses
            dados para entender o desempenho da loja e proteger contra abusos.
          </li>
          <li>
            <strong className="text-foreground">Comunicações:</strong> mensagens que você
            nos envia pelo chat, WhatsApp, e-mail ou avaliações de produtos.
          </li>
        </ul>
        <p>
          Não coletamos dados de cartão de crédito no site. O pagamento é tratado
          diretamente pelos provedores de pagamento/atendimento, em ambiente próprio e
          seguro.
        </p>
      </Section>

      <Section title="3. Por que usamos seus dados (finalidade e base legal)">
        <p>Tratamos seus dados pessoais para as seguintes finalidades:</p>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface/60">
              <tr>
                <th className="px-3 py-2.5 font-medium text-foreground">Finalidade</th>
                <th className="px-3 py-2.5 font-medium text-foreground">Base legal (LGPD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <FinalidadeRow
                finalidade="Processar e entregar seus pedidos, e dar suporte"
                base="Execução de contrato (art. 7º, V)"
              />
              <FinalidadeRow
                finalidade="Enviar novidades, ofertas e a newsletter"
                base="Consentimento (art. 7º, I)"
              />
              <FinalidadeRow
                finalidade="Medir audiência, melhorar a loja e personalizar anúncios"
                base="Consentimento (cookies — art. 7º, I)"
              />
              <FinalidadeRow
                finalidade="Prevenir fraudes, abusos e garantir a segurança"
                base="Legítimo interesse (art. 7º, IX)"
              />
              <FinalidadeRow
                finalidade="Cumprir obrigações legais, fiscais e regulatórias"
                base="Obrigação legal (art. 7º, II)"
              />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Cookies e tecnologias de rastreamento">
        <p>
          Usamos cookies e tecnologias semelhantes para que a loja funcione, para lembrar
          suas preferências e para entender como você usa o site. Eles se dividem em:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-muted">
          <li>
            <strong className="text-foreground">Essenciais:</strong> necessários para o
            funcionamento básico (sacola, sessão, segurança). Não dependem de
            consentimento.
          </li>
          <li>
            <strong className="text-foreground">Analíticos e de marketing:</strong>{" "}
            usados por ferramentas de terceiros como{" "}
            <strong className="text-foreground">Google Analytics</strong> e{" "}
            <strong className="text-foreground">Meta Pixel (Facebook/Instagram)</strong>{" "}
            para medir audiência e personalizar anúncios. Só são ativados{" "}
            <strong className="text-foreground">com o seu consentimento</strong>.
          </li>
        </ul>
        <p>
          Ao entrar no site, você decide se aceita ou recusa esses cookies no aviso
          exibido. Você pode mudar sua escolha a qualquer momento limpando os dados do site
          no seu navegador ou entrando em contato com a gente.
        </p>
      </Section>

      <Section title="5. Com quem compartilhamos">
        <p>
          A HYPADO <strong className="text-foreground">não vende</strong> seus dados
          pessoais. Compartilhamos apenas o necessário, com parceiros que nos ajudam a
          operar a loja:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-muted">
          <li>
            <strong className="text-foreground">Transportadoras</strong> (Correios e
            parceiras), para entregar seus pedidos.
          </li>
          <li>
            <strong className="text-foreground">Provedores de pagamento e atendimento</strong>{" "}
            (incluindo WhatsApp), para concluir e acompanhar a compra.
          </li>
          <li>
            <strong className="text-foreground">Ferramentas de análise e anúncios</strong>{" "}
            (Google, Meta), apenas se você consentir com cookies.
          </li>
          <li>
            <strong className="text-foreground">Provedores de tecnologia e hospedagem</strong>{" "}
            (ex.: Supabase e Netlify), que armazenam os dados de forma segura para o site
            funcionar.
          </li>
          <li>
            <strong className="text-foreground">Autoridades públicas</strong>, quando
            exigido por lei ou ordem judicial.
          </li>
        </ul>
        <p>
          Alguns desses parceiros podem processar dados fora do Brasil. Nesses casos,
          adotamos as garantias previstas na LGPD para a transferência internacional de
          dados.
        </p>
      </Section>

      <Section title="6. Por quanto tempo guardamos">
        <p>
          Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades
          desta Política ou as obrigações legais. Dados de pedidos são mantidos pelos
          prazos fiscais e legais aplicáveis; dados de newsletter, até você cancelar a
          inscrição; e dados de navegação, por período limitado para fins estatísticos.
          Encerrado o prazo, os dados são eliminados ou anonimizados.
        </p>
      </Section>

      <Section title="7. Como protegemos seus dados">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados contra
          acesso não autorizado, perda ou uso indevido — como conexões criptografadas
          (HTTPS), controle de acesso e armazenamento em provedores seguros. Ainda assim,
          nenhum sistema é 100% infalível; em caso de incidente relevante, agiremos
          conforme exige a LGPD.
        </p>
      </Section>

      <Section title="8. Seus direitos como titular">
        <p>
          A LGPD garante a você, a qualquer momento e de forma gratuita, os seguintes
          direitos sobre os seus dados:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-muted">
          <li>Confirmar se tratamos seus dados e acessá-los;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>
            Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados em desconformidade com a lei;
          </li>
          <li>Solicitar a portabilidade dos seus dados a outro fornecedor;</li>
          <li>
            Solicitar a eliminação dos dados tratados com base no seu consentimento;
          </li>
          <li>Obter informação sobre com quem compartilhamos seus dados;</li>
          <li>
            Revogar o consentimento e se opor a tratamentos, nos termos da lei;
          </li>
          <li>Apresentar reclamação à ANPD (Autoridade Nacional de Proteção de Dados).</li>
        </ul>
      </Section>

      <Section title="9. Como exercer seus direitos">
        <p>
          Para exercer qualquer um dos direitos acima, basta entrar em contato com o nosso
          Encarregado pelo e-mail{" "}
          <a href={`mailto:${EMAIL}`} className="text-foreground underline underline-offset-4">
            {EMAIL}
          </a>{" "}
          ou pelo WhatsApp. Responderemos no menor prazo possível. Podemos solicitar
          informações para confirmar a sua identidade antes de atender ao pedido, por
          segurança.
        </p>
      </Section>

      <Section title="10. Dados de crianças e adolescentes">
        <p>
          A loja é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de
          crianças. Se um menor tiver fornecido dados sem o consentimento dos
          responsáveis, entre em contato para que possamos excluí-los.
        </p>
      </Section>

      <Section title="11. Alterações nesta Política">
        <p>
          Podemos atualizar esta Política periodicamente para refletir mudanças na lei ou
          em nossas práticas. A versão vigente estará sempre nesta página, com a data da
          última atualização indicada no topo.
        </p>
      </Section>

      <div className="mt-10 rounded-lg border border-line bg-surface/40 p-4 md:p-5">
        <p className="text-sm text-foreground/80">
          Veja também nossas{" "}
          <Link href="/politica" className="text-foreground underline underline-offset-4">
            políticas de trocas, devoluções e envio
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 md:mt-14">
        <Link
          href="/"
          className="text-[11px] md:text-xs uppercase tracking-widest text-muted hover:text-foreground underline underline-offset-4"
        >
          ← Voltar à home
        </Link>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-9 md:mt-12">
      <h2 className="text-lg md:text-xl font-medium text-foreground">{title}</h2>
      <div className="mt-3 text-sm md:text-base leading-relaxed text-foreground/80 space-y-4">
        {children}
      </div>
    </div>
  );
}

function FinalidadeRow({ finalidade, base }: { finalidade: string; base: string }) {
  return (
    <tr>
      <td className="px-3 py-2.5 align-top text-foreground/80">{finalidade}</td>
      <td className="px-3 py-2.5 align-top text-foreground/70">{base}</td>
    </tr>
  );
}
