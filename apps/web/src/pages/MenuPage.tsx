import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { fetchMenu, formatPrice, type MenuCategory, type MenuItem, type MenuSection } from '../api';
import { Reveal } from '../components/Reveal';
import { whatsappLink } from '../config';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; categories: MenuCategory[] };

const CHEF_CATEGORY = 'Sugestões do Chef';

const SECTIONS: { id: MenuSection; label: string; short: string }[] = [
  { id: 'almoco', label: 'Almoço', short: 'Almoço' },
  { id: 'cafe', label: 'Café e lanches', short: 'Café' },
  { id: 'bebidas', label: 'Bebidas', short: 'Bebidas' },
];

function isSection(value: string | null): value is MenuSection {
  return SECTIONS.some((section) => section.id === value);
}

/** "Estrogonofe" acha "estrogonofe", "camaroes" acha "Camarões". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function matches(item: MenuItem, query: string): boolean {
  return normalize(`${item.name} ${item.description ?? ''}`).includes(query);
}

function slug(category: MenuCategory) {
  return `cat-${category.id}`;
}

function ItemRow({ item, dark = false }: { item: MenuItem; dark?: boolean }) {
  const consult = item.priceCents === null;
  return (
    <li className={`border-b py-4 ${dark ? 'border-creme/10' : 'border-madeira/10'}`}>
      <div className="flex items-baseline gap-3">
        <h3 className="text-[17px] leading-snug font-semibold">{item.name}</h3>
        <span aria-hidden="true" className="min-w-6 flex-1 -translate-y-1 border-b border-dotted border-current opacity-25" />
        <span
          className={`font-serif text-xl font-bold whitespace-nowrap ${
            consult ? 'italic opacity-60' : dark ? 'text-palha' : 'text-folha'
          }`}
        >
          {formatPrice(item.priceCents)}
        </span>
      </div>
      {item.description && (
        <p className={`mt-1 text-sm leading-relaxed ${dark ? 'text-creme/65' : 'text-madeira/60'}`}>{item.description}</p>
      )}
    </li>
  );
}

function CategorySection({ category }: { category: MenuCategory }) {
  if (category.name === CHEF_CATEGORY) {
    return (
      <section
        id={slug(category)}
        className="scroll-mt-48 rounded-2xl bg-madeira-escura px-6 py-10 text-creme shadow-xl sm:px-10"
      >
        <h2 className="font-script text-5xl text-palha sm:text-6xl">{category.name}</h2>
        <p className="mt-2 text-sm text-creme/70">Direto do quadro de giz: pratos especiais que mudam de tempos em tempos.</p>
        <ul className="mt-4 grid gap-x-12 md:grid-cols-2">
          {category.items.map((item) => (
            <ItemRow key={item.id} item={item} dark />
          ))}
        </ul>
      </section>
    );
  }

  const count = category.items.length;
  return (
    <section id={slug(category)} className="scroll-mt-48 rounded-2xl bg-white px-6 py-8 shadow-md sm:px-10">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-pessego pb-3">
        <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{category.name}</h2>
        <span className="text-sm whitespace-nowrap text-madeira/50">
          {count} {count === 1 ? 'opção' : 'opções'}
        </span>
      </div>
      <ul className="grid gap-x-12 md:grid-cols-2">
        {category.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function MenuPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // A aba fica no endereço (/cardapio?aba=cafe), então dá para mandar o link direto de uma aba.
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('aba');
  const tab: MenuSection = isSection(tabParam) ? tabParam : 'almoco';
  const searching = search.trim() !== '';

  function selectTab(section: MenuSection) {
    setSearch('');
    setParams(section === 'almoco' ? {} : { aba: section }, { replace: true });
    // Se já rolou para baixo, volta para o começo da lista.
    const list = listRef.current;
    if (list && window.scrollY > list.offsetTop - 200) window.scrollTo({ top: list.offsetTop - 260 });
  }

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchMenu(controller.signal)
      .then((categories) => setState({ status: 'ready', categories }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  const visible = useMemo(() => {
    if (state.status !== 'ready') return [];
    const query = normalize(search.trim());
    // Sem busca: só a aba escolhida. Com busca: procura no cardápio inteiro.
    if (!query) return state.categories.filter((category) => category.section === tab);
    return state.categories
      .map((category) => ({ ...category, items: category.items.filter((item) => matches(item, query)) }))
      .filter((category) => category.items.length > 0);
  }, [state, search, tab]);

  // Acende o botão da categoria que está no meio da tela enquanto a pessoa rola.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveId(entry.target.id);
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    for (const category of visible) {
      const element = document.getElementById(slug(category));
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [visible]);

  // No celular a barra rola de lado: mantém o botão aceso visível.
  useEffect(() => {
    const nav = navRef.current;
    const chip = activeId ? nav?.querySelector<HTMLElement>(`[href="#${activeId}"]`) : null;
    if (!nav || !chip || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [activeId]);

  return (
    <>
      <section className="relative flex h-[46svh] min-h-80 items-end overflow-hidden text-creme">
        <img src="/fotos/salao-principal.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-madeira-escura/95 via-madeira-escura/60 to-madeira-escura/40" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <p className="animate-sobe text-sm tracking-[0.3em] text-palha uppercase">Empório Gigi Prado</p>
          <h1 className="animate-sobe mt-2 font-serif text-6xl font-semibold sm:text-7xl" style={{ animationDelay: '150ms' }}>
            Cardápio
          </h1>
        </div>
      </section>

      {/* Barra de busca e categorias: gruda no topo enquanto a pessoa rola. */}
      <div className="sticky top-21 z-30 border-b border-madeira/10 bg-creme/95 shadow-sm backdrop-blur sm:top-23">
        <div
          role="tablist"
          aria-label="Partes do cardápio"
          className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-4 pt-3 sm:flex sm:gap-2 sm:px-6"
        >
          {SECTIONS.map((section) => {
            const selected = !searching && tab === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={section.label}
                onClick={() => selectTab(section.id)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-6 sm:text-base ${
                  selected ? 'bg-madeira text-creme shadow' : 'text-madeira/70 hover:bg-madeira/10'
                }`}
              >
                <span className="sm:hidden">{section.short}</span>
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row-reverse md:items-start">
          <label className="relative shrink-0 md:w-64">
            <span className="sr-only">Buscar prato</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar prato..."
              className="w-full rounded-full border border-madeira/20 bg-white px-4 py-2 text-sm outline-none focus:border-folha focus:ring-2 focus:ring-folha/30"
            />
          </label>

          <div className="relative min-w-0 flex-1">
            {/* Celular: os botões rolam de lado. Computador: quebram linha, nenhum fica cortado. */}
            <nav
              ref={navRef}
              aria-label="Categorias do cardápio"
              className="sem-barra flex gap-2 overflow-x-auto pr-8 md:flex-wrap md:overflow-visible md:pr-0"
            >
              {visible.map((category) => {
                const active = activeId === slug(category);
                return (
                  <a
                    key={category.id}
                    href={`#${slug(category)}`}
                    aria-current={active ? 'location' : undefined}
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                      active
                        ? 'border-folha bg-folha text-creme'
                        : 'border-madeira/20 bg-white/60 hover:border-folha hover:text-folha'
                    }`}
                  >
                    {category.name}
                  </a>
                );
              })}
            </nav>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-creme to-transparent md:hidden"
            />
          </div>
        </div>
      </div>

      <div ref={listRef} className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        {searching && state.status === 'ready' && visible.length > 0 && (
          <p className="text-center text-sm text-madeira/60">Buscando em todo o cardápio (almoço, café e bebidas).</p>
        )}
        {state.status === 'loading' && (
          <div aria-label="Carregando cardápio" className="space-y-4 rounded-2xl bg-white p-8 shadow-md">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-madeira/10" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        )}

        {state.status === 'error' && (
          <div role="alert" className="rounded-2xl bg-white p-10 text-center shadow-md">
            <p className="font-serif text-3xl font-semibold">Não conseguimos carregar o cardápio agora</p>
            <p className="mt-2 text-madeira/70">Tente de novo em instantes ou fale com a gente pelo WhatsApp.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="rounded-full bg-folha px-6 py-2 font-medium text-creme hover:bg-folha-escura"
              >
                Tentar de novo
              </button>
              <a
                href={whatsappLink('Olá! Gostaria de ver o cardápio do Empório.')}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-madeira px-6 py-2 font-medium hover:bg-madeira hover:text-creme"
              >
                Pedir pelo WhatsApp
              </a>
            </div>
          </div>
        )}

        {state.status === 'ready' && visible.length === 0 && (
          <p className="text-center text-lg text-madeira/70">
            Nenhum prato encontrado para “{search}”.{' '}
            <button type="button" onClick={() => setSearch('')} className="text-folha underline">
              Limpar busca
            </button>
          </p>
        )}

        {visible.map((category) => (
          <Reveal key={category.id}>
            <CategorySection category={category} />
          </Reveal>
        ))}

        {state.status === 'ready' && (
          <div className="pt-4 text-center text-sm text-madeira/60">
            <p>Preços e pratos podem mudar sem aviso. Itens “Consulte”: pergunte ao atendente.</p>
            <p className="mt-1">Beba com moderação. Venda de bebidas alcoólicas proibida para menores de 18 anos.</p>
          </div>
        )}
      </div>
    </>
  );
}
