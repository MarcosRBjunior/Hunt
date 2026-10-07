type AppProduct = {
  name: string;
  description: string;
  tags: string[];
  votes: number;
  accent: "green" | "blue" | "yellow" | "purple";
  icon: React.ReactNode;
};

const products: AppProduct[] = [
  {
    name: "Milo AI",
    description: "Seu copiloto inteligente para organizar ideias e transformar planos em ação.",
    tags: ["IA", "Produtividade"],
    votes: 298,
    accent: "green",
    icon: <SparkIcon />,
  },
  {
    name: "Layer",
    description: "A API visual que conecta suas ferramentas favoritas em poucos minutos.",
    tags: ["API", "DevTools"],
    votes: 202,
    accent: "blue",
    icon: <LayerIcon />,
  },
  {
    name: "Sunnie",
    description: "Relatórios de marketing claros, bonitos e prontos para compartilhar.",
    tags: ["Marketing", "SaaS"],
    votes: 102,
    accent: "yellow",
    icon: <SunIcon />,
  },
  {
    name: "Orbit",
    description: "Um espaço de trabalho calmo para equipes que pensam grande.",
    tags: ["SaaS", "Produtividade"],
    votes: 29,
    accent: "purple",
    icon: <OrbitIcon />,
  },
];

const topics = ["IA", "Marketing", "Produtividade", "SaaS", "Tech"];

function SparkIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 4c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z" fill="currentColor" />
    </svg>
  );
}

function LayerIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m16 5 12 7-12 7L4 12l12-7Z" fill="currentColor" opacity=".95" />
      <path d="m6 17 10 6 10-6M8 23l8 5 8-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="5.5" fill="currentColor" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
    </svg>
  );
}

function OrbitIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      <ellipse cx="16" cy="16" rx="13" ry="6.5" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-28 16 16)" />
      <circle cx="26" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 11 5-5 5 5M10 6v9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function Logo() {
  return (
    <a className="logo" href="#" aria-label="Nova página inicial">
      <span className="logo-mark"><SparkIcon /></span>
      <span>nova</span>
    </a>
  );
}

function TopicChip({ label }: { label: string }) {
  return <button className="topic-chip">{label}</button>;
}

function UpvoteButton({ votes }: { votes: number }) {
  return (
    <button className="upvote" aria-label={`Votar neste produto. ${votes} votos`}>
      <ArrowUpIcon />
      <span>{votes}</span>
    </button>
  );
}

function AppIcon({ product }: { product: AppProduct }) {
  return (
    <div className={`app-icon app-icon--${product.accent}`}>
      <div>{product.icon}</div>
    </div>
  );
}

function AppCard({ product, rank }: { product: AppProduct; rank: number }) {
  return (
    <article className="app-card">
      <span className="rank">0{rank}</span>
      <AppIcon product={product} />
      <div className="app-copy">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="tag-row">
          {product.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>
      <UpvoteButton votes={product.votes} />
    </article>
  );
}

type ReviewedProductProps = {
  name: string;
  description: string;
  accent: "blue" | "green";
  icon: React.ReactNode;
};

function ReviewedProduct({ name, description, accent, icon }: ReviewedProductProps) {
  return (
    <article className="reviewed-product">
      <div className="review-copy">
        <h3>{name}</h3>
        <p>{description}</p>
        <div className="rating" aria-label="Avaliação: 5 de 5">
          <span className="stars">★★★★★</span>
          <strong>5.0</strong>
          <span>/ 5</span>
        </div>
      </div>
      <div className={`review-icon review-icon--${accent}`}>{icon}</div>
    </article>
  );
}

function ComingSoonItem() {
  return (
    <article className="coming-item">
      <div className="coming-brand">
        <span className="coming-logo"><LayerIcon /></span>
        <div>
          <span className="eyebrow">LANÇAMENTO EM BREVE</span>
          <h3>zwelie</h3>
        </div>
      </div>
      <p>Integre projetos da sua plataforma cloud favorita em um único lugar.</p>
      <a href="#">Quero ser avisado <span>→</span></a>
    </article>
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <header className="header">
        <Logo />
        <nav aria-label="Navegação principal">
          <a className="active" href="#produtos">Produtos</a>
          <a href="#categorias">Categorias</a>
          <a href="#sobre">Sobre</a>
        </nav>
        <div className="header-actions">
          <button className="button button--secondary">Login</button>
          <button className="button button--primary">Registro <span>→</span></button>
        </div>
      </header>

      <main>
        <section className="trending" id="categorias" aria-label="Assuntos em alta">
          <div className="trending-title">
            <span className="pulse-dot" />
            <strong>Trending topics</strong>
          </div>
          <div className="topics">
            {topics.map((topic) => <TopicChip label={topic} key={topic} />)}
          </div>
          <span className="trending-note">Atualizado agora</span>
        </section>

        <div className="content-grid">
          <section className="products-section" id="produtos">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DESTAQUES DE HOJE</span>
                <h1>O Próximo Grande App <span>↓</span></h1>
              </div>
              <a href="#">Ver todos <span>→</span></a>
            </div>
            <div className="product-list">
              {products.map((product, index) => (
                <AppCard product={product} rank={index + 1} key={product.name} />
              ))}
            </div>
          </section>

          <aside className="sidebar">
            <section>
              <div className="sidebar-heading">
                <div>
                  <span className="eyebrow">ESCOLHA DA EQUIPE</span>
                  <h2>Produtos revisados por nós</h2>
                </div>
                <span className="verified-badge">✓</span>
              </div>
              <div className="review-list">
                <ReviewedProduct
                  name="Raycast"
                  description="Produtividade elevada a outro nível."
                  accent="blue"
                  icon={<SparkIcon />}
                />
                <ReviewedProduct
                  name="Linear"
                  description="A melhor forma de construir software."
                  accent="green"
                  icon={<LayerIcon />}
                />
              </div>
            </section>

            <section className="coming-section" id="sobre">
              <div className="coming-heading">
                <span />
                <h2>Em breve</h2>
                <span />
              </div>
              <ComingSoonItem />
            </section>
          </aside>
        </div>
      </main>
      <footer>
        <span>Descubra algo extraordinário.</span>
        <span>© 2025 nova</span>
      </footer>
    </div>
  );
}
