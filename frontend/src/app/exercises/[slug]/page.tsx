import { notFound } from 'next/navigation';
import { api } from '../../../lib/api';
import { ExerciseSession } from './ExerciseSession';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    const topic = await api.topics.get(slug);
    return { title: `${topic.title} — FillBlank` };
  } catch {
    return { title: 'Exercise — FillBlank' };
  }
}

export default async function ExercisePage({ params }: Props) {
  try {
    const { slug } = await params;
    const [topic, exercises] = await Promise.all([
      api.topics.get(slug),
      api.topics.exercises(slug, { limit: 20 }),
    ]);
    return <ExerciseSession topic={topic} exercises={exercises} />;
  } catch {
    return notFound();
  }
}
