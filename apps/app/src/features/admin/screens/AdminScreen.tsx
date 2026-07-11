import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash, Upload, Check } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../shared/contexts/ToastContext";

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'image';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

interface ContentConfig {
  type: string;
  title: string;
  category: 'SPORTS' | 'MOVIES' | 'DINING' | 'DRINKS';
  section_id: string;
  fields: FieldConfig[];
}

const CONFIGS: Record<string, ContentConfig> = {
  turfs: {
    type: 'turfs',
    title: 'Turfs',
    category: 'SPORTS',
    section_id: '6dca5b0c-81e8-405a-851b-1a84664af845',
    fields: [
      { name: 'title', label: 'Turf Name', type: 'text', required: true, placeholder: 'e.g. Play Arena Turf HSR' },
      { name: 'subcategory', label: 'Sport Supported', type: 'select', required: true, options: [
        { label: 'Football', value: 'FOOTBALL' },
        { label: 'Badminton', value: 'BADMINTON' },
        { label: 'Cricket', value: 'CRICKET' },
        { label: 'Basketball', value: 'BASKETBALL' },
        { label: 'Tennis', value: 'TENNIS' },
      ], defaultValue: 'FOOTBALL' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'e.g. Casual 5v5 friendly game on turf' },
      { name: 'location', label: 'Address / Venue Location', type: 'text', required: true, placeholder: 'e.g. Play Arena, Kasavanahalli' },
      { name: 'cover_image_url', label: 'Cover Image', type: 'image', defaultValue: '/assets/plan-covers/football.png' },
      { name: 'suggested_duration_minutes', label: 'Suggested Duration (minutes)', type: 'number', defaultValue: 90 },
      { name: 'suggested_cost_amount', label: 'Suggested Cost Per Person', type: 'number', defaultValue: 150 },
      { name: 'suggested_capacity', label: 'Suggested Capacity (spots)', type: 'number', defaultValue: 10 },
      { name: 'default_rsvp_offset_minutes', label: 'RSVP Cutoff (minutes before start)', type: 'number', defaultValue: 60 },
      { name: 'display_order', label: 'Display Order', type: 'number', defaultValue: 1 },
      { name: 'featured', label: 'Featured Turf', type: 'boolean', defaultValue: false },
    ]
  },
  movies: {
    type: 'movies',
    title: 'Movies',
    category: 'MOVIES',
    section_id: 'ac6c3c7d-2717-4277-8e9e-82570b1ceedf',
    fields: [
      { name: 'title', label: 'Movie Title', type: 'text', required: true, placeholder: 'e.g. IMAX Blockbuster Premiere' },
      { name: 'subcategory', label: 'Genre', type: 'select', required: true, options: [
        { label: 'Action', value: 'ACTION' },
        { label: 'Comedy', value: 'COMEDY' },
        { label: 'Drama', value: 'DRAMA' },
        { label: 'Sci-Fi', value: 'SCI-FI' },
        { label: 'Thriller', value: 'THRILLER' },
        { label: 'Anime', value: 'ANIME' }
      ], defaultValue: 'ACTION' },
      { name: 'description', label: 'Description / Synopsis', type: 'textarea', placeholder: 'e.g. Latest cinematic blockbuster release' },
      { name: 'location', label: 'Cinema Location', type: 'text', required: true, placeholder: 'e.g. Nexus IMAX Koramangala' },
      { name: 'cover_image_url', label: 'Movie Poster / Image', type: 'image', defaultValue: '/assets/plan-covers/movie.png' },
      { name: 'suggested_duration_minutes', label: 'Duration (minutes)', type: 'number', defaultValue: 150 },
      { name: 'suggested_cost_amount', label: 'Ticket Cost', type: 'number', defaultValue: 350 },
      { name: 'suggested_capacity', label: 'Suggested Group Size', type: 'number', defaultValue: 6 },
      { name: 'default_rsvp_offset_minutes', label: 'RSVP Cutoff (minutes before start)', type: 'number', defaultValue: 60 },
      { name: 'display_order', label: 'Display Order', type: 'number', defaultValue: 1 },
      { name: 'featured', label: 'Featured Movie', type: 'boolean', defaultValue: false },
    ]
  }
};

interface AdminScreenProps {
  onBack: () => void;
  token?: string;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack, token }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'home' | 'list' | 'form'>('home');
  const [selectedConfig, setSelectedConfig] = useState<ContentConfig | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchItems = async (config: ContentConfig) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discovery-items", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch discovery items");
      const allItems = await res.json();
      // Filter items matching current category
      const filtered = allItems.filter((i: any) => i.category === config.category);
      setItems(filtered);
    } catch (err: any) {
      showToast(err.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (config: ContentConfig) => {
    setSelectedConfig(config);
    setActiveTab('list');
    fetchItems(config);
  };

  const handleOpenForm = (item?: any) => {
    if (!selectedConfig) return;
    setEditingItem(item || null);
    
    // Initialize form data with item values or field defaults
    const initialData: Record<string, any> = {};
    selectedConfig.fields.forEach(f => {
      if (item && item[f.name] !== undefined) {
        initialData[f.name] = item[f.name];
      } else {
        initialData[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
      }
    });
    setFormData(initialData);
    setActiveTab('form');
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileName = `discovery/img_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error || !data) throw error || new Error("Failed to upload image.");

      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(data.path);

      handleFieldChange(fieldName, publicUrl);
      showToast("Image uploaded successfully.");
    } catch (err: any) {
      showToast(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;

    setLoading(true);
    try {
      const url = editingItem
        ? `/api/admin/discovery-items/${editingItem.id}`
        : "/api/admin/discovery-items";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        ...formData,
        category: selectedConfig.category,
        section_id: selectedConfig.section_id,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save item.");
      }

      showToast(editingItem ? "Item updated successfully." : "Item created successfully.");
      setActiveTab('list');
      fetchItems(selectedConfig);
    } catch (err: any) {
      showToast(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    if (!selectedConfig) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/discovery-items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete item.");

      showToast("Item deleted successfully.");
      fetchItems(selectedConfig);
    } catch (err: any) {
      showToast(err.message || "Failed to delete item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col bg-[#000000] text-left relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', width: '100%', color: '#FFFFFF', height: '100%' }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-white/[0.04] bg-black/40 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'form') setActiveTab('list');
              else if (activeTab === 'list') setActiveTab('home');
              else onBack();
            }}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-sans font-black text-[17px] tracking-tight leading-none">
              {activeTab === 'home' && "Admin Center"}
              {activeTab === 'list' && `${selectedConfig?.title} Manager`}
              {activeTab === 'form' && (editingItem ? `Edit ${editingItem.title}` : `New ${selectedConfig?.title}`)}
            </h2>
            <p className="text-[10px] font-medium text-zinc-550 leading-none mt-1 uppercase font-mono tracking-wider">
              {activeTab === 'home' && "Planless CMS Control"}
              {activeTab === 'list' && "Internal Content Database"}
              {activeTab === 'form' && "Add/Modify Details"}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-none pb-28">
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-[10px] text-zinc-600 tracking-[0.2em] uppercase px-1">
              Select Content Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.values(CONFIGS).map((config) => (
                <button
                  key={config.type}
                  type="button"
                  onClick={() => handleTabClick(config)}
                  className="p-5 rounded-2xl bg-[#09090C] border border-white/[0.05] hover:border-zinc-700 active:scale-98 transition text-left cursor-pointer flex flex-col justify-between h-32 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-white border border-white/[0.02] transition">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">{config.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Manage {config.title.toLowerCase()} listings</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB: LIST */}
        {activeTab === 'list' && selectedConfig && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                {items.length} total records
              </span>
              <button
                type="button"
                onClick={() => handleOpenForm()}
                className="px-3 py-1.5 rounded-lg bg-white text-black font-sans font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {selectedConfig.title.substring(0, selectedConfig.title.length - 1)}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-xs">Loading items...</div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-900 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-zinc-400">No items found</p>
                <p className="text-[10px] text-zinc-650">Create your first {selectedConfig.title.toLowerCase()} list record.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#09090C] border border-white/[0.04] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover border border-white/[0.04]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 border border-white/[0.02]">
                          ?
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-sans font-bold text-xs text-white truncate">{item.title}</h4>
                          {item.featured && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.08] text-zinc-400 text-[8px] font-bold tracking-wider uppercase font-mono">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-sans truncate mt-0.5">{item.location}</p>
                        <p className="text-[9px] text-zinc-600 font-mono mt-1">
                          {item.subcategory} • {item.suggested_duration_minutes}m • {item.suggested_cost_amount} INR
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenForm(item)}
                        className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.03] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.03] flex items-center justify-center text-red-500/80 hover:text-red-400 transition active:scale-95 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FORM */}
        {activeTab === 'form' && selectedConfig && (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {selectedConfig.fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-0.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#09090C] border border-white/[0.06] text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={3}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full p-3 rounded-xl bg-[#09090C] border border-white/[0.06] text-white text-xs font-sans placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition resize-none"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    required={field.required}
                    value={formData[field.name] === undefined ? "" : formData[field.name]}
                    onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#09090C] border border-white/[0.06] text-white text-xs font-sans focus:outline-none focus:border-zinc-700 transition"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#09090C] border border-white/[0.06] text-white text-xs font-sans focus:outline-none focus:border-zinc-700 transition appearance-none cursor-pointer"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'boolean' && (
                  <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData[field.name]}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-300 font-sans">{field.label} Status</span>
                  </label>
                )}

                {field.type === 'image' && (
                  <div className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      {formData[field.name] ? (
                        <img
                          src={formData[field.name]}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-zinc-600 text-xs">No Image</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="h-9 px-4 rounded-lg bg-zinc-900 border border-white/[0.06] text-[11px] font-sans font-bold flex items-center justify-center gap-2 hover:text-white transition active:scale-95 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={uploadingImage}
                          onChange={(e) => handleImageUpload(e, field.name)}
                        />
                      </label>
                      <p className="text-[8px] text-zinc-550 font-sans uppercase tracking-widest px-0.5">
                        Allowed formats: JPG, PNG, WEBP.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full h-11 rounded-xl bg-white text-black font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {loading ? "Saving Record..." : "Save Record"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
