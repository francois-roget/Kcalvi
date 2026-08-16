import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * RM16 (historique immuable) impose de la rigueur sur les changements de
 * schéma : toute évolution ajoute une migration explicite ici, jamais un
 * reset de base (voir TECHNICAL_SPECS.MD §5.1).
 */
export const migrations = schemaMigrations({
  migrations: [],
});
