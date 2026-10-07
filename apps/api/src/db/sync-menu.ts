import { eq } from 'drizzle-orm';
import { sha256 } from '../lib/tokens.js';
import { cardapio, type MenuCategoryData } from '../menu/cardapio.js';
import type { Db } from './client.js';
import { menuCategories, menuItems, settings } from './schema.js';

const VERSION_KEY = 'menu_version';

/**
 * Deixa o cardápio do banco igual ao arquivo src/menu/cardapio.ts.
 * Roda toda vez que a API sobe; se o arquivo não mudou desde a última vez, não faz nada.
 * Retorna true quando atualizou.
 *
 * Atenção: o arquivo manda. Mudanças feitas direto no banco (ex.: marcar um prato como
 * esgotado) somem na próxima vez que o arquivo do cardápio mudar.
 */
export async function syncMenu(db: Db, data: MenuCategoryData[] = cardapio): Promise<boolean> {
  const version = sha256(JSON.stringify(data));
  const [current] = await db.select().from(settings).where(eq(settings.key, VERSION_KEY));
  if (current?.value === version) return false;

  await db.transaction(async (tx) => {
    await tx.delete(menuItems);
    await tx.delete(menuCategories);

    for (const [categoryIndex, category] of data.entries()) {
      const [created] = await tx
        .insert(menuCategories)
        .values({ name: category.name, section: category.section, position: categoryIndex + 1 })
        .returning({ id: menuCategories.id });
      if (category.items.length === 0) continue;
      await tx.insert(menuItems).values(
        category.items.map((item, itemIndex) => ({
          categoryId: created!.id,
          name: item.name,
          description: item.description ?? null,
          priceCents: item.price === null ? null : Math.round(item.price * 100),
          position: itemIndex + 1,
        })),
      );
    }

    await tx
      .insert(settings)
      .values({ key: VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: settings.key, set: { value: version } });
  });
  return true;
}
