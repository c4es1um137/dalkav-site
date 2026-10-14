import type { APIRoute } from 'astro';
import { notesFeed } from '../../lib/rss';

export const GET: APIRoute = () => notesFeed('tr');
