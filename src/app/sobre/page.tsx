import { SimplePage } from "../_components/SimplePage";

export const metadata = { title: "Sobre · HYPADO" };

export default function SobrePage() {
  return (
    <SimplePage eyebrow="A marca" title="Norte é direção. Nordeste é raiz.">
      <p>
        A HYPADO nasceu no nordeste do Brasil pra vestir quem usa a rua como passarela.
        Streetwear feito com modelagem própria, tecidos pesados e silk que não craquela.
      </p>
      <p>
        Cada drop é limitado, sem reposição. A gente trabalha em coleções pequenas, com
        peças costuradas em fábricas parceiras no Nordeste, prezando qualidade e identidade
        antes de volume.
      </p>
      <p>
        Aqui não tem moda passageira. Tem peça pra durar e atitude pra carregar.
      </p>
    </SimplePage>
  );
}
