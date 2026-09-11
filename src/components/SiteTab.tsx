"use client";

import { useState, useEffect } from "react";

export default function SiteTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sizes, setSizes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        if (cats.length > 0) setCategoryId(cats[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId || !images || images.length === 0) {
      setError("Заповніть обов'язкові поля (Назва, Ціна, Категорія, Фото)");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    if (oldPrice) formData.append("oldPrice", oldPrice);
    formData.append("description", description);
    
    // Convert sizes like "S, M, L" to array ["S", "M", "L"]
    const sizesArray = sizes.split(",").map(s => s.trim()).filter(Boolean);
    formData.append("sizes", JSON.stringify(sizesArray));
    formData.append("categoryId", categoryId);

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const r = await fetch("/api/sanity/products", {
        method: "POST",
        body: formData,
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Помилка збереження");
      }

      // Success
      setShowModal(false);
      resetForm();
      fetchData(); // Reload list
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setOldPrice("");
    setDescription("");
    setSizes("");
    setImages(null);
  };

  return (
    <div className="tcard">
      <div className="tcard-top">
        <div style={{display:"flex",alignItems:"center"}}>
          <h2>Товари на Сайті</h2>
          <span>{products.length}</span>
        </div>
        <div>
          <button className="hbtn" onClick={() => setShowModal(true)}>+ Додати на сайт</button>
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
                <th>Назва</th>
                <th>Категорія</th>
                <th>Ціна (₴)</th>
                <th>Розміри</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    ) : '—'}
                  </td>
                  <td className="n">{p.name}</td>
                  <td>{p.category}</td>
                  <td>₴{p.price}</td>
                  <td><span className="tag">{p.sizes?.join(', ') || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Додати товар на сайт</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="modal-form">
              {error && <div className="login-err" style={{marginBottom: 15}}>{error}</div>}
              
              <div className="form-group">
                <label>Назва *</label>
                <input value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ціна (₴) *</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Стара ціна (₴)</label>
                  <input type="number" value={oldPrice} onChange={e => setOldPrice(e.target.value)} />
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
                <label>Розміри (через кому: S, M, L)</label>
                <input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="Наприклад: S, M, L, XL" />
              </div>

              <div className="form-group">
                <label>Фотографії *</label>
                <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} required />
              </div>

              <div className="form-group">
                <label>Опис</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}></textarea>
              </div>

              <button type="submit" disabled={saving} className="save-btn">
                {saving ? "Збереження в Sanity..." : "Зберегти на сайт"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
