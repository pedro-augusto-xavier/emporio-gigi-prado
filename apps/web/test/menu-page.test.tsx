import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatPrice, type MenuCategory } from '../src/api';
import { App } from '../src/App';

const menu: MenuCategory[] = [
  {
    id: 'c1',
    name: 'Sugestões do Chef',
    section: 'almoco',
    items: [
      { id: 'i1', categoryId: 'c1', name: 'Truta com molho de pinhão', description: null, priceCents: 8200, imageUrl: null },
    ],
  },
  {
    id: 'c2',
    name: 'Massas Empório',
    section: 'almoco',
    items: [
      { id: 'i2', categoryId: 'c2', name: 'Massa Empório com Camarões', description: null, priceCents: 7300, imageUrl: null },
      { id: 'i3', categoryId: 'c2', name: 'Massa Empório com Cogumelos', description: null, priceCents: 6000, imageUrl: null },
    ],
  },
  {
    id: 'c3',
    name: 'Bebidas',
    section: 'bebidas',
    items: [{ id: 'i4', categoryId: 'c3', name: 'Vinhos', description: null, priceCents: null, imageUrl: null }],
  },
];

function mockApi(response: { ok: boolean; body?: unknown }) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: response.ok,
    status: response.ok ? 200 : 500,
    json: async () => response.body,
  } as Response);
}

function renderMenu(url = '/cardapio') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('formatPrice', () => {
  it('formata em reais ou mostra "Consulte"', () => {
    expect(formatPrice(8900)).toMatch(/R\$\s89,00/);
    expect(formatPrice(150)).toMatch(/R\$\s1,50/);
    expect(formatPrice(null)).toBe('Consulte');
  });
});

describe('página do cardápio', () => {
  it('busca o cardápio na API e mostra categorias, pratos e preços', async () => {
    const fetchSpy = mockApi({ ok: true, body: { categories: menu } });
    renderMenu();

    expect(await screen.findByText('Massa Empório com Camarões')).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith('/api/menu', expect.anything());
    expect(screen.getByRole('heading', { name: 'Sugestões do Chef' })).toBeTruthy();
    expect(screen.getByText(/R\$\s73,00/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Massas Empório' }).getAttribute('href')).toBe('#cat-c2');
  });

  it('abre na aba Almoço e troca de aba sem recarregar', async () => {
    mockApi({ ok: true, body: { categories: menu } });
    renderMenu();
    await screen.findByText('Massa Empório com Camarões');
    expect(screen.getByRole('tab', { name: 'Almoço' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText('Vinhos')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Bebidas' }));
    expect(screen.getByText('Vinhos')).toBeTruthy();
    expect(screen.getByText('Consulte')).toBeTruthy();
    expect(screen.queryByText('Massa Empório com Camarões')).toBeNull();
  });

  it('o link /cardapio?aba=bebidas já abre na aba certa', async () => {
    mockApi({ ok: true, body: { categories: menu } });
    renderMenu('/cardapio?aba=bebidas');
    expect(await screen.findByText('Vinhos')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Bebidas' }).getAttribute('aria-selected')).toBe('true');
  });

  it('a busca procura em todas as abas', async () => {
    mockApi({ ok: true, body: { categories: menu } });
    renderMenu();
    await screen.findByText('Massa Empório com Camarões');
    fireEvent.change(screen.getByPlaceholderText('Buscar prato...'), { target: { value: 'vinho' } });
    expect(screen.getByText('Vinhos')).toBeTruthy();
    expect(screen.getByText(/Buscando em todo o cardápio/)).toBeTruthy();
  });

  it('busca ignora acentos e maiúsculas, e avisa quando não encontra', async () => {
    mockApi({ ok: true, body: { categories: menu } });
    renderMenu();
    await screen.findByText('Massa Empório com Camarões');

    const search = screen.getByPlaceholderText('Buscar prato...');
    fireEvent.change(search, { target: { value: 'CAMAROES' } });
    expect(screen.getByText('Massa Empório com Camarões')).toBeTruthy();
    expect(screen.queryByText('Massa Empório com Cogumelos')).toBeNull();
    expect(screen.queryByText('Vinhos')).toBeNull();

    fireEvent.change(search, { target: { value: 'pizza' } });
    expect(screen.getByText(/Nenhum prato encontrado/)).toBeTruthy();
  });

  it('mostra aviso e botão de tentar de novo se a API falhar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = mockApi({ ok: false });
    renderMenu();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Não conseguimos carregar o cardápio/);

    fetchSpy.mockResolvedValue({ ok: true, status: 200, json: async () => ({ categories: menu }) } as Response);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('Massa Empório com Camarões')).toBeTruthy();
  });

  it('topo já fica com fundo nesta página (não há foto grande atrás)', async () => {
    mockApi({ ok: true, body: { categories: menu } });
    renderMenu();
    expect(screen.getByRole('banner').dataset.solid).toBe('true');
    await screen.findByText('Massa Empório com Camarões');
  });
});
