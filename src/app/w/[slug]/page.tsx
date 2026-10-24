import { notFound } from 'next/navigation';
import { Participant } from '@/components/participant';
export default async function ParticipantPage({ params }: { params: Promise<{ slug: string }> }) { if ((await params).slug !== 'kivi') notFound(); return <Participant/>; }
