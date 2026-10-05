import type { Db } from '../db/client.js';
import { auditLogs } from '../db/schema.js';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
}

/** Registro de quem fez o quê (sem dados pessoais), exigência de prestação de contas da LGPD. */
export async function audit(db: Db, entry: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values({ ...entry, entityId: entry.entityId ?? null });
}
