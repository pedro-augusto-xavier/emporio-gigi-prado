import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

afterEach(cleanup);

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );
}

describe('página inicial', () => {
  it('topo começa transparente e ganha fundo ao rolar a página', () => {
    renderHome();
    const header = screen.getByRole('banner');
    expect(header.dataset.solid).toBe('false');

    act(() => {
      window.scrollY = 300;
      fireEvent.scroll(window);
    });
    expect(header.dataset.solid).toBe('true');
  });

  it('todos os links de WhatsApp vão para o número do restaurante', () => {
    renderHome();
    const links = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.includes('wa.me'));
    expect(links.length).toBeGreaterThan(3);
    for (const href of links) expect(href).toMatch(/^https:\/\/wa\.me\/5522992339210\?text=/);
  });

  it('mostra as avaliações com link para o Tripadvisor', () => {
    renderHome();
    const section = document.getElementById('avaliacoes')!;
    expect(section.querySelectorAll('article')).toHaveLength(6);
    const link = screen.getByRole('link', { name: /ver todas as avaliações/i });
    expect(link.getAttribute('href')).toContain('tripadvisor.com.br');
  });

  it('rodapé mostra horário, endereço e os dias fechados', () => {
    renderHome();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toContain('Nova Friburgo');
    expect(footer.textContent).toContain('Segunda e terça');
    expect(footer.textContent).toContain('Fechado');
  });

  it('destaca massas, peixes e sobremesas', () => {
    renderHome();
    const section = document.getElementById('especialidades')!;
    for (const title of ['Massas', 'Peixes', 'Sobremesas']) expect(section.textContent).toContain(title);
  });

  it('seção de bebidas mostra espumantes, vinhos e cervejas, com aviso de consumo responsável', () => {
    renderHome();
    const section = document.getElementById('bebidas')!;
    for (const drink of ['Espumantes', 'Vinhos', 'Cervejas artesanais']) expect(section.textContent).toContain(drink);
    expect(section.textContent).toMatch(/proibida para menores de 18 anos/);
  });

  it('avisa que cachorros são bem-vindos', () => {
    renderHome();
    expect(document.getElementById('pets')!.textContent).toContain('Seu cachorro é bem-vindo');
    expect(screen.getByText('Posso levar meu cachorro?')).toBeTruthy();
  });

  it('tem perguntas frequentes e o mapa do endereço', () => {
    renderHome();
    expect(screen.getByText('Tem estacionamento?')).toBeTruthy();
    const map = screen.getByTitle(/mapa/i);
    expect(map.getAttribute('src')).toContain('Nova%20Friburgo');
  });

  it('todas as fotos com conteúdo têm descrição (acessibilidade)', () => {
    renderHome();
    // Fotos só decorativas usam alt="" e ficam fora da lista de imagens de propósito.
    for (const img of screen.getAllByRole('img')) expect(img.getAttribute('alt')).toBeTruthy();
  });
});

describe('celular e Google', () => {
  it('barra fixa do celular tem Reservar, Cardápio e WhatsApp', () => {
    renderHome();
    const bar = screen.getByRole('navigation', { name: 'Ações rápidas' });
    expect(bar.textContent).toContain('Reservar mesa');
    expect(bar.textContent).toContain('Cardápio');
    expect(bar.querySelector('a[href^="https://wa.me/5522992339210"]')).toBeTruthy();
  });

  it('cada página tem o seu título na aba do navegador', () => {
    render(
      <MemoryRouter initialEntries={['/privacidade']}>
        <App />
      </MemoryRouter>,
    );
    expect(document.title).toBe('Política de Privacidade · Empório Gigi Prado');
  });
});
