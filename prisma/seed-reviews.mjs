import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NAMES = [
  "Lucas M.", "Pedro H.", "Mateus A.", "João V.", "Gabriel S.", "Davi L.",
  "Igor R.", "Caio B.", "Rafael T.", "Thiago C.", "André P.", "Felipe O.",
  "Bruno N.", "Diego F.", "Vinícius E.", "Marcos D.", "Henrique L.", "Erick V.",
  "Mariana S.", "Ana C.", "Beatriz R.", "Carolina P.", "Júlia M.", "Larissa F.",
  "Camila T.", "Fernanda L.", "Letícia A.", "Isabela O.", "Sophia N.",
];

const CITIES = [
  "Recife, PE", "Olinda, PE", "Caruaru, PE", "Petrolina, PE",
  "Fortaleza, CE", "Sobral, CE", "Juazeiro do Norte, CE",
  "Salvador, BA", "Feira de Santana, BA", "Ilhéus, BA", "Porto Seguro, BA",
  "Natal, RN", "Mossoró, RN", "João Pessoa, PB", "Campina Grande, PB",
  "Maceió, AL", "Aracaju, SE", "São Luís, MA", "Teresina, PI",
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Brasília, DF",
];

const TEMPLATES = {
  5: [
    {
      title: "Vestiu igual a foto",
      body: "Pedi GG, chegou perfeito. Tecido pesado, costura bem feita, estampa firme. Tô usando direto.",
    },
    {
      title: "Qualidade premium mesmo",
      body: "Achei que ia ser igual essas marcas genéricas. Surpreendeu. Vale cada centavo.",
    },
    {
      title: "Entrega rápida, peça top",
      body: "Chegou em 3 dias aqui em {CITY}. Embalagem caprichada com adesivo da marca. Recomendo demais.",
    },
    {
      title: "Identidade nordestina forte",
      body: "Finalmente uma marca de streetwear que representa o nordeste sem ser caricata. Caimento perfeito.",
    },
    {
      title: "Já é a segunda que peço",
      body: "Comprei uma há 2 meses e voltei pra outra. Não desbota, não desfia, não deforma na lavagem.",
    },
    {
      title: "Atendimento foi 10",
      body: "Tive dúvida no tamanho, mandei mensagem no WhatsApp e responderam na hora. Acertei o tamanho de primeira.",
    },
  ],
  4: [
    {
      title: "Muito boa, mas atenção no tamanho",
      body: "A peça é excelente. Só que o caimento é mais largo do que parece — se quiser justo, peça um número menor.",
    },
    {
      title: "Qualidade ótima",
      body: "Acabamento muito bom. Só achei a entrega um pouco demorada pra cá, mas valeu a espera.",
    },
    {
      title: "Tecido top, modelo certo",
      body: "Adorei o tecido e o caimento. Tirei uma estrela porque a cor ficou levemente diferente da foto, mas nada que estrague.",
    },
  ],
  3: [
    {
      title: "Bonita mas demorou",
      body: "Peça boa, qualidade ok. A entrega que demorou bastante. Espero que melhorem.",
    },
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRating() {
  const r = Math.random();
  if (r < 0.72) return 5;
  if (r < 0.93) return 4;
  return 3;
}

async function main() {
  await prisma.review.deleteMany();

  const products = await prisma.product.findMany({ select: { id: true } });
  let total = 0;

  for (const p of products) {
    const count = 3 + Math.floor(Math.random() * 5); // 3-7 reviews
    for (let i = 0; i < count; i++) {
      const rating = weightedRating();
      const tpl = pick(TEMPLATES[rating]);
      const city = pick(CITIES);
      const daysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.review.create({
        data: {
          productId: p.id,
          rating,
          authorName: pick(NAMES),
          city,
          title: tpl.title,
          body: tpl.body.replace("{CITY}", city),
          verified: Math.random() < 0.78,
          createdAt,
        },
      });
      total++;
    }
  }

  console.log(`Seeded ${total} reviews across ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
