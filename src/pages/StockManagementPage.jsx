import React, { useMemo, useState, useEffect, useCallback } from "react";
import AssetTable from "../components/AssetTable";
import UploadCSVModal from "../components/UploadCSVModal";
import ViewAssetModal from "../components/ViewAssetModal";
import ReduceAssetModal from "../components/ReduceAssetModal";
import { AddAssetModal, EditAssetModal } from "../components/AssetFormModal";
import Toast, { useToast } from "../components/Toast";
import StockPredictionsPanel from "../components/StockPredictionsPanel";

const API_BASE = "https://punto-production-21ed.up.railway.app/api/v1/stock";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const computeStatus = (quantity, minimumThreshold) => {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= (minimumThreshold ?? 5)) return "Low Stock";
  return "In Stock";
};

const mapAsset = (item) => ({
  id: item._id,
  name: item.name,
  sku: item.sku,
  vendor: item.vendor ?? "",
  category: item.category,
  quantity: item.quantity,
  unit: item.unit ?? "pcs",
  minimumThreshold: item.minimumThreshold ?? 5,
  value: item.cost,
  currency: item.currency ?? "SAR",
  status: item.status ?? computeStatus(item.quantity, item.minimumThreshold),
  location: item.location ?? "",
});

const formatCurrency = (value, currency = "SAR") =>
  `${value.toLocaleString()} ${currency}`;

const StockManagementPage = ({ currentUserRole }) => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [showPredictions, setShowPredictions] = useState(false);

  const { toasts, close: closeToast, error: toastError } = useToast();

  const isAdmin = currentUserRole === "admin" || currentUserRole === "manager";

  const handlePredictionsLoaded = useCallback((predictions) => {
    const criticalItems = predictions.filter((p) => p.status === 'critical');
    if (criticalItems.length > 0) {
      toastError(
        'Critical Stock Alert',
        `${criticalItems.length} item${criticalItems.length === 1 ? '' : 's'} will run out in under 5 days: ${criticalItems.map(i => i.item_name).join(', ')}. IT tickets have been opened automatically.`,
        7000
      );
    }
  }, [toastError]);

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      if (!res.ok)
        throw new Error(`Error ${res.status}: Failed to load assets`);
      const json = await res.json();
      const items = Array.isArray(json)
        ? json
        : (json.data?.data ?? json.data ?? []);
      setAssets(items.map(mapAsset));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const term = searchQuery.toLowerCase();
    return assets.filter((a) =>
      [a.name, a.sku, a.category, a.vendor, a.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term)),
    );
  }, [searchQuery, assets]);

  const summary = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.value * a.quantity, 0);
    const lowStock = assets.filter((a) => a.status === "Low Stock").length;
    const outOfStock = assets.filter((a) => a.status === "Out of Stock").length;
    return { totalItems: assets.length, lowStock, outOfStock, totalValue };
  }, [assets]);

  const openModal = (name, asset = null) => {
    setSelectedAsset(asset);
    setActiveModal(name);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAsset(null);
  };

  const handleAdd = async (formData) => {
    try {
      const body = {
        name: formData.name,
        sku: formData.sku,
        vendor: formData.vendor,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        minimumThreshold: Number(formData.minimumThreshold),
        cost: Number(formData.value),
        currency: formData.currency,
        location: formData.location,
      };
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create asset");
      }
      await fetchAssets();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = async (formData) => {
    try {
      const newQty = Number(formData.quantity);
      const newThreshold = Number(formData.minimumThreshold);
      const body = {
        name: formData.name,
        sku: formData.sku,
        vendor: formData.vendor,
        category: formData.category,
        quantity: newQty,
        unit: formData.unit,
        minimumThreshold: newThreshold,
        cost: Number(formData.value),
        currency: formData.currency,
        location: formData.location,
        status: computeStatus(newQty, newThreshold),
      };
      const res = await fetch(`${API_BASE}/${formData.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update asset");
      }
      await fetchAssets();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`))
      return;
    try {
      const res = await fetch(`${API_BASE}/${asset.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete asset");
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadCSV = async (file) => {
    // 1. بنجهز الملف عشان يتبعت
    const formData = new FormData();
    formData.append("file", file); // هنا اسم الحقل 'file' اللي الباك إند هيستقبله

    try {
      // 2. بنبعت الريكويست للباك إند (تأكد إن البورت 5000 والمسار صح بتاعك)
      const response = await fetch(
        "https://punto-production-21ed.up.railway.app/api/v1/stock/upload",
        {
          method: "POST",
          headers: {
            // لو عاملين سيستم لوجين بتوكن، السطر ده مهم جداً عشان الميدل وير بتاع protect
            Authorization: `Bearer ${localStorage.getItem("token")}`, // أو المكان اللي شايلين فيه التوكن
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        alert("تم رفع الملف بنجاح!");
        closeModal();
        // يستحسن هنا تنده على الفانكشن اللي بتجيب الداتا عشان الجدول يعمل ريفريش أوتوماتيك
        // fetchStocks();
      } else {
        alert("حصل مشكلة: " + result.message);
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert("حصل مشكلة في الاتصال بالسيرفر");
    }
  };

  const handleReduce = async (id, quantityToReduce, reason) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const newQty = Math.max(0, asset.quantity - quantityToReduce);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quantity: newQty,
          status: computeStatus(newQty, asset.minimumThreshold),
        }),
      });
      if (!res.ok) throw new Error("Failed to reduce stock");
      setAssets((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                quantity: newQty,
                status: computeStatus(newQty, a.minimumThreshold),
              }
            : a,
        ),
      );
      console.log("Reduce audit", { id, quantityToReduce, reason });
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  
  const statCards = [
  {
    label: "Total Items",
    value: summary.totalItems,
    valueColor: "#534AB7",
    bg: "#EEF1FD",
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  },
  {
    label: "Low Stock",
    value: summary.lowStock,
    valueColor: "#534AB7",
    bg: "#EEF1FD",
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  {
    label: "Out of Stock",
    value: summary.outOfStock,
    valueColor: "#534AB7",
    bg: "#EEF1FD",
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  {
    label: "Total Value",
    value: formatCurrency(summary.totalValue),
    valueColor: "#534AB7",
    bg: "#EEF1FD",
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
];

  return (
    <div className="ds-page">
      <div className="page-content-wrapper">
        {/* Page Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Stock Management
              </h1>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#8A9FE8",
                  background: "#EEF1FD",
                  border: "1px solid #C7D2F8",
                  borderRadius: 20,
                  padding: "2px 10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {isAdmin ? "Admin / Manager" : "IT User"}
              </span>
            </div>
            <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: 0 }}>
              Role-based inventory controls for IT assets — Manage stock across
              departments with audit tracking.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div className="ds-search-wrap" style={{ width: 300 }}>
              <span className="ds-search-icon">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, category..."
                className="ds-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    display: "flex",
                    padding: 2,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowPredictions((v) => !v)}
              className="ds-btn ds-btn-secondary"
              style={showPredictions ? { background: '#EEF1FD', borderColor: '#8A9FE8', color: '#534AB7' } : undefined}
            >
              🤖 AI Stock Predictions
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => openModal("upload")}
                  className="ds-btn ds-btn-secondary"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                  Upload CSV
                </button>
                <button
                  onClick={() => openModal("add")}
                  className="ds-btn ds-btn-primary"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Asset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span
              style={{
                fontSize: "0.875rem",
                color: "#DC2626",
                fontWeight: 500,
              }}
            >
              {error}
            </span>
            <button
              onClick={fetchAssets}
              style={{
                marginLeft: "auto",
                fontSize: "0.8rem",
                color: "#8A9FE8",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* AI Stock Predictions */}
        {showPredictions && (
          <StockPredictionsPanel onLoaded={handlePredictionsLoaded} />
        )}

        {/* Loading state */}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #E9EBF0",
                borderTop: "3px solid #8A9FE8",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>
              Loading assets...
            </p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="ds-card"
                  style={{ padding: "20px 24px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#9CA3AF",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          margin: "0 0 10px",
                        }}
                      >
                        {stat.label}
                      </p>
                      <p
                        style={{
                          fontSize:
                            stat.label === "Total Value" ? "1.3rem" : "2rem",
                          fontWeight: 800,
                          color: stat.valueColor,
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: stat.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,}}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Asset Inventory Card */}
            <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #E9EBF0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#111827",
                      margin: "0 0 2px",
                    }}
                  >
                    Asset Inventory
                  </h2>
                  <p
                    style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}
                  >
                    Complete list of managed assets with real-time status.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    background: "#F3F4F6",
                    border: "1px solid #E9EBF0",
                    borderRadius: 20,
                    padding: "4px 12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {filteredAssets.length} of {assets.length} showing
                </span>
              </div>

              <AssetTable
                assets={filteredAssets}
                currentUserRole={currentUserRole}
                onViewAsset={(asset) => openModal("view", asset)}
                onEditAsset={(asset) => openModal("edit", asset)}
                onDeleteAsset={handleDelete}
                onReduceAsset={(asset) => openModal("reduce", asset)}
              />
            </div>
          </>
        )}
      </div>

      {activeModal === "view" && selectedAsset && (
        <ViewAssetModal asset={selectedAsset} onClose={closeModal} />
      )}
      {activeModal === "reduce" && selectedAsset && (
        <ReduceAssetModal
          asset={selectedAsset}
          onClose={closeModal}
          onConfirm={handleReduce}
        />
      )}
      {/* {activeModal === 'upload' && (
        <UploadCSVModal onClose={closeModal} onUpload={(file) => { console.log('Upload CSV file', file); closeModal(); }} />
      )} */}
      {activeModal === "upload" && (
        <UploadCSVModal onClose={closeModal} onUpload={handleUploadCSV} />
      )}
      {activeModal === "add" && (
        <AddAssetModal onClose={closeModal} onSubmit={handleAdd} />
      )}
      {activeModal === "edit" && selectedAsset && (
        <EditAssetModal
          asset={selectedAsset}
          onClose={closeModal}
          onSubmit={handleEdit}
        />
      )}

      <Toast toasts={toasts} onClose={closeToast} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default StockManagementPage;
