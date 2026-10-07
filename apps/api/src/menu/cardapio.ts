import type { MenuSection } from '../db/schema.js';

/**
 * CARDÁPIO DO EMPÓRIO GIGI PRADO
 *
 * Este arquivo é a fonte do cardápio do site. Para mudar um preço, um prato ou a ordem,
 * edite aqui e mande para o GitHub: quando a API reinicia, ela percebe a mudança e
 * atualiza o banco sozinha (veja src/db/sync-menu.ts).
 *
 * - price: em reais (84 = R$ 84,00). Use null para "Consulte".
 * - A ordem das categorias e dos pratos aqui é a ordem que aparece no site.
 *
 * Fontes: cardápio do almoço e cardápio de café/lanches (PDFs de out/2026) e quadro de sugestões.
 */

export interface MenuItemData {
  name: string;
  description?: string;
  price: number | null;
}

export interface MenuCategoryData {
  name: string;
  section: MenuSection;
  items: MenuItemData[];
}

export const cardapio: MenuCategoryData[] = [
  // ======================= ALMOÇO =======================
  {
    name: 'Sugestões do Chef',
    section: 'almoco',
    items: [
      { name: 'Mignon grelhado', description: 'Molho mostarda, linguine de alho negro e ervas', price: 89 },
      { name: 'Costelinha assada em forno baixo', description: 'Creme de baroa e molho com toque oriental', price: 80 },
      { name: 'Truta com molho de pinhão', description: 'Batatinhas e cogumelos na manteiga de ervas', price: 82 },
      { name: 'Camarão grelhado', description: 'Açafrão e creme de baroa', price: 85 },
    ],
  },
  {
    name: 'Entradas',
    section: 'almoco',
    items: [
      {
        name: 'Entradinha da Casa',
        description: 'Pães, manteiga, geleia especial, pastas, patês e vinagretes. Consulte as opções do dia',
        price: 35,
      },
      { name: 'Bolinho de Bacalhau', description: 'Porção com 5 unidades', price: 37 },
      { name: 'Mini Linguiças', description: 'Porção. Acompanham mostardas e pães', price: 37 },
      { name: 'Harumaki', description: 'Camarão ou legumes', price: 35 },
      { name: 'Sopas', description: 'Consulte as opções do dia', price: 30 },
      { name: 'Mini Salada', price: 25 },
    ],
  },
  {
    name: 'Peixes',
    section: 'almoco',
    items: [
      { name: 'Peixe grelhado no azeite', description: 'Especiarias e legumes assados', price: 84 },
      { name: 'Truta grelhada com amêndoas', description: 'Batatas gratinadas com queijo', price: 86 },
    ],
  },
  {
    name: 'Carnes',
    section: 'almoco',
    items: [
      { name: 'Mignon grelhado ao molho francês', description: 'Batatas arrepiadas', price: 93 },
      { name: 'Estrogonofe de Mignon', price: 78 },
    ],
  },
  {
    name: 'Rosti',
    section: 'almoco',
    items: [
      { name: 'Rosti de Camarão', price: 78 },
      { name: 'Rosti de Cogumelos', price: 74 },
    ],
  },
  {
    name: 'Vegetariano',
    section: 'almoco',
    items: [
      { name: 'Prato da Horta', description: 'Legumes orgânicos, azeite e ervas', price: 68 },
      { name: 'Estrogonofe de Cogumelos', price: 72 },
    ],
  },
  {
    name: 'Infantil',
    section: 'almoco',
    items: [{ name: 'Prato Infantil', description: 'Consulte as opções do dia. Serve crianças até 12 anos', price: 48 }],
  },
  {
    name: 'Massas Empório',
    section: 'almoco',
    items: [
      { name: 'Massa Empório com Camarões', price: 80 },
      { name: 'Massa Empório com Cogumelos', price: 68 },
    ],
  },
  {
    name: 'Sobremesas',
    section: 'almoco',
    items: [
      { name: 'Pudim', price: 15 },
      { name: 'Torta', description: 'Maçãs, damascos e lascas de amêndoas, alemã ou mil-folhas', price: 30 },
      { name: 'Rabanada da Casa', price: 30 },
      { name: 'Profiteroles', description: 'Tradicional, com sorvete e calda quente de chocolate', price: 35 },
      {
        name: 'Morango Empório',
        description: 'A mesma massa choux, morangos com creme especial e calda de morangos frescos',
        price: 38,
      },
      { name: 'Mousse Três Chocolates', price: 30 },
    ],
  },

  // =================== CAFÉ E LANCHES ===================
  {
    name: 'Cafés e chás',
    section: 'cafe',
    items: [
      { name: 'Cafezinho', price: 6 },
      { name: 'Expresso pequeno / Americano', price: 9 },
      { name: 'Expresso duplo', price: 15 },
      { name: 'Caffè Macchiato / Latte Macchiato', price: 17 },
      { name: 'Cappuccino / Chocolate', description: 'Quente ou gelado', price: 17 },
      { name: 'Cappuccino com leite de coco', price: 20 },
      { name: 'Chás / Mate da Casa', description: 'Quente ou gelado', price: 9 },
    ],
  },
  {
    name: 'Pães e sanduíches',
    section: 'cafe',
    items: [
      { name: 'Pão na Chapa / Torradas', price: 8 },
      { name: 'Misto / Queijo Quente', price: 22 },
      {
        name: 'Pão de Queijo',
        description: 'Feitinho na hora! Porção com 3 unidades, acompanha manteiga ou geleia',
        price: 20,
      },
      { name: 'Wrap / Sanduíche de Cogumelos', price: 26 },
      { name: 'Wrap / Sanduíche Especial do Dia', price: 26 },
    ],
  },
  {
    name: 'Salgados',
    section: 'cafe',
    items: [
      { name: 'Omeletes', price: 23 },
      { name: 'Ovos Mexidos Empório', price: 12 },
      { name: 'Bolinho de Bacalhau', description: 'Porção com 5 unidades', price: 37 },
      { name: 'Mini Linguiças', description: 'Porção. Acompanha pão e mostardas', price: 37 },
      { name: 'Harumaki', description: 'Legumes ou camarão', price: 35 },
      { name: 'Mini Salada', price: 25 },
      { name: 'Sopas', description: 'Consulte as opções do dia', price: 30 },
    ],
  },
  {
    name: 'Doces',
    section: 'cafe',
    items: [
      { name: 'Bolo (fatia)', description: 'Consulte as opções do dia', price: 9 },
      { name: 'Bolo (fatia especial)', description: 'Consulte as opções do dia', price: 18 },
      { name: 'Pudim', price: 15 },
      { name: 'Torta', description: 'Maçãs, damascos e lascas de amêndoas, alemã ou mil-folhas', price: 30 },
      { name: 'Profiteroles', description: 'Tradicional, com sorvete e calda quente de chocolate', price: 35 },
      {
        name: 'Morango Empório',
        description: 'A mesma massa choux, morangos com creme especial e calda de morangos frescos',
        price: 38,
      },
      { name: 'Rabanada da Casa', price: 30 },
      { name: 'Mousse Três Chocolates', price: 30 },
    ],
  },

  // ======================= BEBIDAS =======================
  {
    name: 'Sucos e smoothies',
    section: 'bebidas',
    items: [
      { name: 'Sucos', description: 'Copo. Laranja, abacaxi, limonada suíça ou morango', price: 15 },
      {
        name: 'Sucos Especiais',
        description: 'Copo. Limonada das Neves, Limonada dos Sonhos ou Drink Empório (sabor duplo)',
        price: 24,
      },
      { name: 'Smoothies', description: 'Bebida gelada e cremosa de frutas', price: 20 },
    ],
  },
  {
    name: 'Águas e refrigerantes',
    section: 'bebidas',
    items: [
      { name: 'Água Mineral', price: 6 },
      { name: 'Água Saborizada da Casa', price: 10 },
      { name: 'Refrigerantes', description: 'Lata', price: 9 },
    ],
  },
  {
    name: 'Cervejas, vinhos e caipirinha',
    section: 'bebidas',
    items: [
      { name: 'Cerveja Long Neck', description: '330 ml', price: 15 },
      { name: 'Cervejas Artesanais', price: null },
      { name: 'Vinhos', price: null },
      { name: 'Caipirinha (frutas)', price: null },
    ],
  },
];
