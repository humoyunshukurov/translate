import Link from 'next/link';
import { api } from '../lib/api';
export default async function Home() {
  const topics = await api.topics.list().catch(() => []);
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Fill in the Blanks</h1>
      <p className="text-gray-500 mb-8">Choose a topic to practice English grammar</p>
      <div className="space-y-3">
        {topics.map(t => (
          <Link key={t.id} href={`/exercises/${t.slug}`}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all">
            <div>
              <p className="font-semibold text-gray-900">{t.title}</p>
              <p className="text-sm text-gray-500">{t.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{t.level}</span>
              <p className="text-xs text-gray-400 mt-1">{t.exerciseCount ?? 0} exercises</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
