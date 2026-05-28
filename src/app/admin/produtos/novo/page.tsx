import { ProductForm } from "../_components/ProductForm";

export default function NovoProdutoPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-sm text-neutral-500 mt-1">Preencha os dados e salve.</p>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
