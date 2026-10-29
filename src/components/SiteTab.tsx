"use client";

import { useState, useEffect } from "react";

export default function SiteTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [availability, setAvailability] = useState("");
  const [condition, setCondition] = useState("");
  const [season, setSeason] = useState("");
  const [authenticity, setAuthenticity] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [sizes, setSizes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/sanity/products"),
        fetch("/api/sanity/categories")
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) setCategoryId(cats[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingProduct(null);
    if (categories.length > 0) setCategoryId(categories[0]._id);
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    resetForm();
    setEditingProduct(p);
    setName(p.name || p.title || "");
    setPrice(String(p.price || ""));
    setOldPrice(p.oldPrice ? String(p.oldPrice) : "");
    setDescription(p.description || "");
    setMaterial(p.material || "");
    setAvailability(p.availability || "");
    setCondition(p.condition || "");
    setSeason(p.season || "");
    setAuthenticity(p.authenticity || "");
    
    if (p.measurements && Array.isArray(p.measurements)) {
      const mStr = p.measurements
        .map((m: any) => `${m.size ? m.size + ': ' : ''}${m.details || ''}`)
        .join('\n');
      setMeasurements(mStr);
    } else {
      setMeasurements("");
    }

    setSizes((p.sizes || []).join(", "));
    
    // Match category
    const cat = categories.find(c => c._id === p.categoryId || c.name === p.category);
    setCategoryId(cat ? cat._id : (p.categoryId || (categories[0]?._id || "")));

    const imgs = p.images?.length ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    setExistingImages(imgs);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      setError("Заповніть обов'язкові поля (Назва, Ціна, Категорія)");
      return;
    }

    if (!editingProduct && (!images || images.length === 0)) {
      setError("Додайте щонайменше одне фото товару");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    if (editingProduct) {
      formData.append("id", editingProduct._id);
    }
    formData.append("name", name);
    formData.append("price", price);
    if (oldPrice) formData.append("oldPrice", oldPrice);
    formData.append("description", description);
    formData.append("material", material);
    formData.append("availability", availability);
    formData.append("condition", condition);
    formData.append("season", season);
    formData.append("authenticity", authenticity);
    formData.append("measurements", measurements);

    // Convert sizes like "S, M, L" to array ["S", "M", "L"]
    const sizesArray = sizes.split(",").map(s => s.trim()).filter(Boolean);
    formData.append("sizes", JSON.stringify(sizesArray));
    formData.append("categoryId", categoryId);

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const url = "/api/sanity/products";
      const method = editingProduct ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        body: formData,
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Помилка збереження");
      }

      setShowModal(false);
      resetForm();
      fetchData(); // Reload list
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Видалити товар "${name}" з сайту?`)) return;
    try {
      const res = await fetch(`/api/sanity/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Помилка видалення');
      }
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.message || 'Не вдалося видалити товар');
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setOldPrice("");
    setDescription("");
    setMaterial("");
    setAvailability("");
    setCondition("");
    setSeason("");
    setAuthenticity("");
    setMeasurements("");
    setSizes("");
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setError("");
  };

  return (
    <div className="tcard">
      <div className="tcard-top">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Товари на Сайті</h2>
          <span>{products.length}</span>
        </div>
        <div>
          <button className="hbtn" onClick={handleOpenAdd}>+ Додати на сайт</button>
        </div>
      </div>

      <div className="tbl-wrap">
        {loading ? (
          <div className="loading-wrap">Завантаження з Sanity CMS...</div>
        ) : products.length === 0 ? (
          <div className="empty-wrap">
            <h3>Немає товарів на сайті</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Фото</th>
                <th>Назва та Характеристики</th>
                <th>Категорія</th>
                <th>Ціна (₴)</th>
                <th>Розміри / Заміри</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                    ) : '—'}
                  </td>
                  <td className="n">
                    <strong>{p.name}</strong>
                    {p.availability && (
                      <div style={{ fontSize: 11, color: '#059669', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                        {p.availability}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {p.material && (
                        <span style={{ fontSize: 10, background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                          🧵 {p.material}
                        </span>
                      )}
                      {p.condition && (
                        <span style={{ fontSize: 10, background: '#f8fafc', color: '#475569', padding: '1px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          Стан: {p.condition}
                        </span>
                      )}
                      {p.season && (
                        <span style={{ fontSize: 10, background: '#f8fafc', color: '#475569', padding: '1px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          Сезон: {p.season}
                        </span>
                      )}
                      {p.authenticity && (
                        <span style={{ fontSize: 10, background: '#f8fafc', color: '#475569', padding: '1px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                          ✓ {p.authenticity}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 3, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td>{p.category || '—'}</td>
                  <td>
                    <strong>₴{p.price}</strong>
                    {p.oldPrice && <div style={{ fontSize: 11, color: '#999', textDecoration: 'line-through' }}>₴{p.oldPrice}</div>}
                  </td>
                  <td>
                    <span className="tag">{p.sizes?.join(', ') || '—'}</span>
                    {p.measurements && p.measurements.length > 0 && (
                      <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4, fontWeight: 500 }}>
                        📏 Замірів: {p.measurements.length}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        style={{
                          padding: '5px 12px',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        ✎ Змінити
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p._id, p.name)}
                        style={{
                          padding: '5px 10px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'all 0.2s'
                        }}
                      >
                        ✕ Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Редагувати товар на сайті" : "Додати товар на сайт"}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="modal-form">
              {error && <div className="login-err" style={{ marginBottom: 15 }}>{error}</div>}
              
              <div className="form-group">
                <label>Назва товару *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Наприклад: NO FAITH STUDIOS Longsleeve" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ціна (₴) *</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="3000" required />
                </div>
                <div className="form-group">
                  <label>Стара ціна (₴)</label>
                  <input type="number" value={oldPrice} onChange={e => setOldPrice(e.target.value)} placeholder="Необов'язково" />
                </div>
              </div>

              <div className="form-group">
                <label>Категорія *</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Розміри (через кому: S, M, L або 42, 43)</label>
                <input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="Наприклад: S, M, L, XL" />
              </div>

              {/* Availability Status */}
              <div className="form-group">
                <label>Статус наявності / доставки</label>
                <input 
                  value={availability} 
                  onChange={e => setAvailability(e.target.value)} 
                  placeholder="За замовчуванням: В наявності в Києві (1–2 дні)" 
                />
              </div>

              {/* Characteristics Block */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                  Характеристики артефакту
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12 }}>Матеріал</label>
                    <input 
                      value={material} 
                      onChange={e => setMaterial(e.target.value)} 
                      placeholder="100% Щільна преміальна бавовна (Premium Cotton)" 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12 }}>Стан</label>
                    <input 
                      value={condition} 
                      onChange={e => setCondition(e.target.value)} 
                      placeholder="10/10 (Новий з бірками)" 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 12 }}>Сезон</label>
                    <input 
                      value={season} 
                      onChange={e => setSeason(e.target.value)} 
                      placeholder="All-Season / Мультисезонний" 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 12 }}>Автентичність</label>
                    <input 
                      value={authenticity} 
                      onChange={e => setAuthenticity(e.target.value)} 
                      placeholder="100% Curated Piece" 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Таблиця розмірів / Заміри (по одному рядку на розмір)</label>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
                  Формат: Розмір: Заміри (наприклад: S: Довжина 72см, Груди 56см, Плечі 50см)
                </div>
                <textarea 
                  rows={4} 
                  value={measurements} 
                  onChange={e => setMeasurements(e.target.value)}
                  placeholder="S: Груди 56см, Довжина 72см, Плечі 50см&#10;M: Груди 58см, Довжина 74см, Плечі 52см&#10;L: Груди 60см, Довжина 76см, Плечі 54см&#10;XL: Груди 62см, Довжина 78см, Плечі 56см"
                  style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '1.4' }}
                />
              </div>

              <div className="form-group">
                <label>
                  {editingProduct ? "Нові фото (залиште порожнім, щоб залишити поточні)" : "Фотографії товару *"}
                </label>
                <label className="file-upload-box">
                  <div className="file-upload-text">
                    {editingProduct ? "Натисніть сюди, щоб завантажити нові фото" : "Натисніть сюди, щоб вибрати фото"}
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} />
                </label>

                {/* Existing Images preview */}
                {editingProduct && existingImages.length > 0 && imagePreviews.length === 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Поточні фото в Sanity:</div>
                    <div className="image-preview-container">
                      {existingImages.map((src, idx) => (
                        <div key={idx} className="image-preview">
                          <img src={src} alt="existing" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Previews */}
                {imagePreviews.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#0284c7', marginBottom: 6 }}>Нові обрані фото (замінять старі):</div>
                    <div className="image-preview-container">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="image-preview">
                          <img src={src} alt="preview" />
                          <button type="button" className="remove-btn" onClick={() => removeNewImage(idx)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Опис товару</label>
                <textarea 
                  rows={4} 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Вкажіть детальний опис, особливості фасону, стан та деталі"
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, border: '1px solid #ddd', background: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  Скасувати
                </button>
                <button type="submit" disabled={saving} className="save-btn" style={{ flex: 2 }}>
                  {saving ? "Збереження в Sanity..." : (editingProduct ? "Зберегти зміни" : "Додати товар")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
