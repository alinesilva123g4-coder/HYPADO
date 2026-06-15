import Link from "next/link";
import { ProductForm } from "../_components/ProductForm";

export default function NovoProdutoPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para produtos
      </Link>

      <header className="mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M3 7.5 12 3l9 4.5" />
            <path d="M3 7.5v9L12 21l9-4.5v-9" />
            <path d="M12 12 3 7.5M12 12l9-4.5M12 12v9" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">HYPADO · catálogo</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Novo produto</h1>
        </div>
      </header>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <ProductForm mode="create" />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-[12px] text-sky-900 leading-snug">
        <span className="text-base leading-none mt-0.5">💡</span>
        <span>
          Depois de criar, você adiciona as <strong>fotos</strong> e os <strong>tamanhos com estoque</strong> na
          página do produto. Sem tamanhos cadastrados, ele aparece como esgotado na loja.
        </span>
      </div>
    </div>
  );
}
