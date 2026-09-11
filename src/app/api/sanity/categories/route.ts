import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';

export async function GET() {
  try {
    const categories = await sanityClient.fetch(`
      *[_type == "category"] | order(name asc) {
        _id,
        name
      }
    `);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Failed to fetch sanity categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
