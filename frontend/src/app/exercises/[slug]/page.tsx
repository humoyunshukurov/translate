import { api } from '../../../lib/api';
import { ExerciseSession } from './ExerciseSession';

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = await api.topics.get(slug).catch(() => null);
  return { title: topic ? `${topic.title} — FillBlank` : 'Exercise' };
}

export default async function ExercisePage({ params }: Props) {
  const { slug } = await params;
  const [topic, exercises] = await Promise.all([
    api.topics.get(slug),
    api.topics.exercises(slug, { limit: 20 }),
  ]);
  return <ExerciseSession topic={topic} exercises={exercises} />;
}
