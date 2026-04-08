import { SOURCE_IDS, type SourceId } from '@/constants/sources';

export function generateId(source: SourceId): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${source}-${timestamp}-${random}`;
}
