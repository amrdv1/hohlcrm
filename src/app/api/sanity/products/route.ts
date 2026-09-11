import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';

export async function GET() {
  try {
    const products = await sanityClient.fetch(`
      *[_type == "product"] | order(_createdAt desc) {
        _id,
        name,
        price,
        "imageUrl": images[0].asset->url,
        "category": category->name,
        sizes
      }
    `);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Failed to fetch sanity products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // We expect FormData to handle image uploads
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const oldPrice = formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined;
    const description = formData.get('description') as string;
    const sizes = JSON.parse(formData.get('sizes') as string);
    const categoryId = formData.get('categoryId') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!name || !price || !categoryId || imageFiles.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Upload images to Sanity
    const uploadedImages = [];
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await sanityClient.assets.upload('image', buffer, {
        filename: file.name,
      });
      uploadedImages.push({
        _type: 'image',
        _key: Math.random().toString(36).substring(7),
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      });
    }

    // 2. Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 3. Create Product Document
    const newProduct = {
      _type: 'product',
      name,
      slug: { current: slug },
      price,
      oldPrice,
      description,
      sizes,
      category: {
        _type: 'reference',
        _ref: categoryId,
      },
      images: uploadedImages,
    };

    const created = await sanityClient.create(newProduct);
    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Failed to create sanity product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
