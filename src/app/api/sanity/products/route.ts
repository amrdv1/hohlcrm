import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await sanityClient.fetch(`
      *[_type == "product"] | order(_createdAt desc) {
        _id,
        "name": title,
        title,
        price,
        oldPrice,
        description,
        "imageUrl": coalesce(images[0].secure_url, images[0].asset->url),
        "images": coalesce(images[]{ "url": coalesce(secure_url, asset->url) }.url, []),
        "category": category->title,
        "categoryId": category->_ref,
        sizes,
        measurements
      }
    `);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Failed to fetch sanity products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const translit = (str: string) => {
  const ru: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y',
    'э': 'e', 'ю': 'yu', 'я': 'ya', 'ь': '', 'ъ': ''
  };
  return str.split('').map(l => ru[l] || l).join('');
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const oldPrice = formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined;
    const description = (formData.get('description') as string) || '';
    const sizes = JSON.parse((formData.get('sizes') as string) || '[]');
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
    let slug = translit(name.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slug) slug = Date.now().toString();

    // 3. Create Product Document
    const newProduct = {
      _type: 'product',
      title: name,
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

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const oldPrice = formData.get('oldPrice') ? Number(formData.get('oldPrice')) : undefined;
    const description = (formData.get('description') as string) || '';
    const sizesRaw = formData.get('sizes') as string;
    const categoryId = formData.get('categoryId') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!id || !name || isNaN(price)) {
      return NextResponse.json({ error: 'Missing product ID, name, or valid price' }, { status: 400 });
    }

    const patchData: Record<string, any> = {
      title: name,
      price,
      description,
    };

    if (oldPrice !== undefined && !isNaN(oldPrice)) {
      patchData.oldPrice = oldPrice;
    }

    if (sizesRaw) {
      try {
        patchData.sizes = JSON.parse(sizesRaw);
      } catch {
        patchData.sizes = sizesRaw.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (categoryId) {
      patchData.category = {
        _type: 'reference',
        _ref: categoryId,
      };
    }

    // Upload new images if provided
    if (imageFiles && imageFiles.length > 0 && imageFiles[0].size > 0) {
      const uploadedImages = [];
      for (const file of imageFiles) {
        if (!file.size) continue;
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
      if (uploadedImages.length > 0) {
        patchData.images = uploadedImages;
      }
    }

    const updated = await sanityClient.patch(id).set(patchData).commit();
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Failed to update sanity product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    await sanityClient.delete(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete sanity product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
