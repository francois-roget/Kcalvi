import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { migrations } from './migrations';
import { modelClasses } from './models';
import { schema } from './schema';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses,
});
